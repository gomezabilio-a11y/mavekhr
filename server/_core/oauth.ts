/**
 * OAuth routes — REMOVED.
 * Manus OAuth has been replaced with DB-based email/password login.
 * This file is kept as an empty stub to avoid breaking any imports.
 * The /api/oauth/callback route is no longer registered.
 */
import type { Express } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function registerOAuthRoutes(_app: Express) {
  // No-op: Manus OAuth routes have been removed.
  // Login is handled by POST /api/auth/login in server/_core/index.ts
}
