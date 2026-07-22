/**
 * Storage proxy: backward-compatibility route for /manus-storage/* URLs.
 *
 * Old Forge-era URLs stored in the DB look like /manus-storage/<key>.
 * This handler rewrites them to serve from local disk via the same
 * storageResolve() path used by /api/download/*.
 *
 * New uploads always return /api/download/<key> directly, so this
 * handler is only needed for legacy data already in the database.
 */

import type { Express } from "express";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { storageResolve } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const filePath = storageResolve(key);

      if (!fs.existsSync(filePath)) {
        // File not on local disk — return 404 (legacy Forge files won't be available)
        res.status(404).send("File not found");
        return;
      }

      const stat = fs.statSync(filePath);
      const contentType =
        (mime.lookup(filePath) as string | false) || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(500).send("Storage error");
    }
  });
}
