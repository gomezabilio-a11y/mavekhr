/**
 * Server-side environment variables.
 *
 * Removed (no longer used):
 *   - VITE_APP_ID, OAUTH_SERVER_URL, OWNER_OPEN_ID  (Manus OAuth)
 *   - Storage no longer calls Forge API (see server/storage.ts — local disk)
 *
 * Still present:
 *   - forgeApiUrl / forgeApiKey  used by LLM, image generation, voice transcription,
 *     notification, map, and data API integrations (not storage).
 */
export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Forge API — used by LLM, image gen, voice, notification, maps, data API
  // NOT used by storage (storage is now local disk)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
