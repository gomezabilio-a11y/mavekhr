/**
 * Server-side environment variables.
 * Manus OAuth env vars (VITE_APP_ID, OAUTH_SERVER_URL, OWNER_OPEN_ID) have been removed.
 * Storage (BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY) is still used until Step 3 migration.
 */
export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
