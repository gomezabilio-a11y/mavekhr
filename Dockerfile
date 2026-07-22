# ─────────────────────────────────────────────────────────────────────────────
# MAVEK HR Portal — Railway Deployment Dockerfile
#
# This Dockerfile is needed because the default Manus deploy image does not
# include the `drizzle/` migration files at runtime, which are required for
# `pnpm db:push` and schema inspection. It also ensures the correct Node.js
# version (22) and sets up the storage directory structure.
#
# Railway Persistent Volume:
#   Mount your volume at /app/storage (or set STORAGE_DIR env var to override).
#   All uploaded employee photos and documents will be written there.
#
# Build:  docker build -t hr-portal .
# Run:    docker run -p 3000:3000 --env-file .env hr-portal
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-slim

# Install corepack for pnpm version pinning
RUN npm install -g corepack@latest && corepack enable

WORKDIR /app

# Copy all source files (build context = committed source only)
COPY . .

# Install ALL dependencies (devDeps needed for vite build + esbuild)
RUN corepack pnpm install --frozen-lockfile

# Build: Vite (frontend → dist/public) + esbuild (server → dist/index.js)
RUN corepack pnpm run build

# Set production environment
ENV NODE_ENV=production

# Default storage directory — override with STORAGE_DIR env var on Railway
# to point to a Persistent Volume mount (e.g. /mnt/volume/storage)
ENV STORAGE_DIR=/app/storage

# Create the default storage directory (Railway volume will shadow this if mounted)
RUN mkdir -p /app/storage

# Expose the port (Railway sets PORT at runtime; server reads process.env.PORT)
EXPOSE 3000

# Start the production server
CMD ["node", "dist/index.js"]
