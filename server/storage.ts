/**
 * Local disk storage helpers.
 *
 * Files are written to STORAGE_DIR (env: STORAGE_DIR, default: /app/storage on Railway,
 * ./uploads in local dev). The directory is created on first use.
 *
 * Public access is served via GET /api/download/:key(*) in index.ts.
 * storagePut  → writes file to disk, returns { key, url: "/api/download/<key>" }
 * storageGet  → returns { key, url: "/api/download/<key>" }  (no external call needed)
 */

import fs from "fs";
import path from "path";

/**
 * Resolve the root storage directory.
 * Priority: STORAGE_DIR env → /app/storage (Railway) → <project-root>/uploads (local dev)
 */
function getStorageDir(): string {
  if (process.env.STORAGE_DIR) return process.env.STORAGE_DIR;
  // On Railway the working directory is /app; use a persistent volume mount there.
  if (process.env.RAILWAY_ENVIRONMENT) return "/app/storage";
  // Local development: store next to the project root
  return path.resolve(process.cwd(), "uploads");
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  // Strip leading slashes and prevent path traversal
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "_");
}

/**
 * Write data to local disk.
 * @param relKey  Relative file key, e.g. "employee-photos/abc123.jpg"
 * @param data    Buffer, Uint8Array, or string content
 * @param _contentType  Ignored (kept for API compatibility)
 * @returns { key, url } where url is the /api/download/<key> path
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, key);

  // Ensure the subdirectory exists (e.g. employee-photos/)
  ensureDir(path.dirname(filePath));

  const buffer =
    typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.from(data as Uint8Array);

  fs.writeFileSync(filePath, buffer);

  return { key, url: `/api/download/${key}` };
}

/**
 * Get the download URL for a stored file.
 * No external call needed — just returns the local download path.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/api/download/${key}` };
}

/**
 * Returns the absolute filesystem path for a given key.
 * Used internally by the /api/download route to serve the file.
 */
export function storageResolve(relKey: string): string {
  const key = normalizeKey(relKey);
  return path.join(getStorageDir(), key);
}

/**
 * Kept for API compatibility with legacy callers that expected a signed URL.
 * Now simply returns the local /api/download/<key> path.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/api/download/${key}`;
}
