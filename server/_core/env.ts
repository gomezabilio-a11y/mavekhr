/**
 * Server-side environment variables.
 *
 * ── Removed (no longer used) ──────────────────────────────────────────────
 *   - VITE_APP_ID, OAUTH_SERVER_URL, OWNER_OPEN_ID  (Manus OAuth — removed Step 2)
 *   - Storage no longer calls Forge API (local disk — removed Step 3)
 *
 * ── Required for core functionality ──────────────────────────────────────
 *   - JWT_SECRET      : Session cookie signing (server will boot without it but
 *                       all logins will fail — always set in production)
 *   - DATABASE_URL    : MySQL/TiDB connection string (required)
 *
 * ── Optional Forge API (LLM / image gen / voice / notification / maps) ───
 *   - BUILT_IN_FORGE_API_URL / BUILT_IN_FORGE_API_KEY
 *     Both default to "" so the server boots safely even without them.
 *     Individual feature functions guard against empty values at call time
 *     (e.g. "if (!ENV.forgeApiUrl) throw new Error(...)") — the server itself
 *     never throws on startup due to missing Forge credentials.
 *
 * ── Storage (local disk) ─────────────────────────────────────────────────
 *   - STORAGE_DIR     : Absolute path for uploaded files.
 *                       Railway: set to the Persistent Volume mount path,
 *                       e.g. /mnt/volume/storage
 *                       Local dev: defaults to <project-root>/uploads
 */
export const ENV = {
  // ── Core ──────────────────────────────────────────────────────────────────
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // ── Optional Forge API integrations (LLM, image gen, voice, notification) ─
  // Both default to "" — server boots safely without them.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
