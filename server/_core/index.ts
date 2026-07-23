import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut, storageResolve } from "../storage";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "@shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migration] DATABASE_URL not set — skipping migrations");
    return;
  }
  // Use a dedicated connection for migrations (not the shared pool)
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const db = drizzle(connection);
    // migrationsFolder: drizzle SQL files live at <project-root>/drizzle/
    // process.cwd() is the project root in both dev (tsx) and prod (node dist/index.js
    // started from /app in Docker). Override with DRIZZLE_MIGRATIONS_DIR if needed.
    const migrationsFolder =
      process.env.DRIZZLE_MIGRATIONS_DIR ??
      path.join(process.cwd(), "drizzle");
    console.log(`[Migration] Running migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log("[Migration] Migrations completed successfully");
  } catch (err: any) {
    // Never crash the server due to migration errors.
    // Common cases:
    //   errno 1050 / ER_TABLE_EXISTS_ERROR — tables already exist (drizzle-kit push was
    //     used previously and __drizzle_migrations tracking table is absent). Safe to ignore.
    //   Any other error — log it as a warning so ops can investigate, but keep serving.
    const isTableExists =
      err?.errno === 1050 ||
      err?.code === "ER_TABLE_EXISTS_ERROR" ||
      (typeof err?.message === "string" && err.message.includes("already exists"));

    if (isTableExists) {
      console.warn(
        "[Migration] Table-already-exists — schema is current, skipping migration."
      );
    } else {
      // Log but do NOT re-throw: server stays up regardless of migration outcome.
      console.error("[Migration] Warning: migration encountered an error (server will continue):", err?.message ?? err);
    }
  } finally {
    await connection.end();
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ── Health check (must be first — Railway pings this before DB is ready) ────
  app.get("/healthz", (_req, res) => res.status(200).send("OK"));

  // ── Email + Password Login endpoint ──────────────────────────────────────
  app.post("/api/auth/login", express.json(), async (req, res) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Find user by email:
      // 1. Check employees table first (regular employees)
      // 2. Fall back to users table directly (admin-only accounts)
      let user: typeof users.$inferSelect | undefined;

      const empRows = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
      const emp = empRows[0];
      if (emp?.userId) {
        const userRows = await db.select().from(users).where(eq(users.id, emp.userId)).limit(1);
        user = userRows[0];
      }

      // Fallback: look up directly in users table by email
      if (!user) {
        const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        user = userRows[0];
      }

      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Update lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Issue session token (DB-based auth)
      const token = await sdk.signSession({
        userId: String(user.id),
        email: user.email ?? email,
        role: user.role ?? "user",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, role: user.role });
    } catch (err: any) {
      console.error("[Login] Error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ── File download endpoint ───────────────────────────────────────────────────
  app.get("/api/download/:fileKey(*)", (req, res) => {
    try {
      // Decode URI component to handle percent-encoded characters in the key
      const fileKey = decodeURIComponent(req.params.fileKey ?? "");
      if (!fileKey) {
        res.status(400).json({ error: "Missing file key" });
        return;
      }

      const filePath = storageResolve(fileKey);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      const stat = fs.statSync(filePath);
      const contentType =
        (mime.lookup(filePath) as string | false) || "application/octet-stream";

      // Use original filename from query param if provided, otherwise fall back to key basename
      const queryFilename = req.query.filename as string | undefined;
      const displayName = queryFilename
        ? decodeURIComponent(queryFilename)
        : (path.basename(filePath));

      res.setHeader("Content-Type", contentType);
      // RFC 5987 encoding for Unicode filenames (Korean, etc.)
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(displayName)}"; filename*=UTF-8''${encodeURIComponent(displayName)}`
      );
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-store");

      fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error("[Download] Failed:", err);
      res.status(500).json({ error: err.message ?? "Download failed" });
    }
  });

  // ── File upload endpoint for employee documents ────────────────────────────
  app.post("/api/upload/document", express.json({ limit: "20mb" }), async (req, res) => {
    try {
      const { base64, mimeType, fileName } = req.body as { base64: string; mimeType: string; fileName: string };
      if (!base64 || !mimeType) {
        res.status(400).json({ error: "base64 and mimeType are required" });
        return;
      }
      const buffer = Buffer.from(base64, "base64");
      // Use UUID-based key to avoid encoding issues with Korean/special characters
      const ext = (fileName ?? "document").split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") ?? "pdf";
      const uuid = crypto.randomUUID().replace(/-/g, "");
      const key = `employee-documents/${Date.now()}-${uuid}.${ext}`;
      const { url } = await storagePut(key, buffer, mimeType);
      // Return both the storage URL and the original filename for display
      res.json({ url, originalFileName: fileName ?? "document" });
    } catch (err: any) {
      console.error("[Upload] Document upload failed:", err);
      res.status(500).json({ error: err.message ?? "Upload failed" });
    }
  });

  // ── Photo upload endpoint ──────────────────────────────────────────────────
  // Accepts base64-encoded image from the frontend, uploads to S3, returns URL
  app.post("/api/upload/photo", express.json({ limit: "10mb" }), async (req, res) => {
    try {
      const { base64, mimeType, fileName } = req.body as { base64: string; mimeType: string; fileName: string };
      if (!base64 || !mimeType) {
        res.status(400).json({ error: "base64 and mimeType are required" });
        return;
      }
      const buffer = Buffer.from(base64, "base64");
      const ext = mimeType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") ?? "jpg";
      const uuid = crypto.randomUUID().replace(/-/g, "");
      const key = `employee-photos/${Date.now()}-${uuid}.${ext}`;
      const { url } = await storagePut(key, buffer, mimeType);
      res.json({ url });
    } catch (err: any) {
      console.error("[Upload] Photo upload failed:", err);
      res.status(500).json({ error: err.message ?? "Upload failed" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    // Run DB migrations after port is open so Railway health checks pass
    // during the migration window. Requests will be served normally;
    // DB-dependent routes will fail gracefully until migrations complete.
    // runMigrations() is fully non-fatal — errors are logged as warnings inside.
    runMigrations();
  });
}

startServer().catch(console.error);
