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
import { storagePut } from "../storage";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

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

      // Find user by email (check employees table first for the email, then users)
      const empRows = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
      const emp = empRows[0];
      if (!emp || !emp.userId) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const userRows = await db.select().from(users).where(eq(users.id, emp.userId)).limit(1);
      const user = userRows[0];
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

      // Issue session token (same mechanism as OAuth)
      const token = await sdk.signSession({
        openId: user.openId,
        appId: process.env.VITE_APP_ID ?? "hr-portal",
        name: user.name ?? email,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, role: user.role });
    } catch (err: any) {
      console.error("[Login] Error:", err);
      res.status(500).json({ error: "Login failed" });
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
      const ext = fileName?.split(".").pop() ?? "pdf";
      const key = `employee-documents/${Date.now()}-${(fileName ?? "document").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url } = await storagePut(key, buffer, mimeType);
      res.json({ url });
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
      const ext = mimeType.split("/")[1] ?? "jpg";
      const key = `employee-photos/${Date.now()}-${(fileName ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
