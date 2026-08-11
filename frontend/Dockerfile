# frontend/Dockerfile
#
#   --target development   Next dev server with hot reload. Expects the source tree to be
#                          bind-mounted over /app (see docker-compose.yml), so the image
#                          carries only node_modules.
#   --target production     next build output served by the standalone server, running as a
#                          non-root user with NODE_ENV=production. Default target.

# ── Dependencies ──────────────────────────────────────────────────────────────
# Shared by both targets so dev and prod resolve the identical lockfile.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Development ───────────────────────────────────────────────────────────────

FROM node:22-alpine AS development
WORKDIR /app
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Build ─────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS builder
WORKDIR /app
# NODE_ENV=production during the build so Next tree-shakes development-only code out of the
# client bundle. devDependencies are already installed in deps, which npm would prune here.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Production (default) ──────────────────────────────────────────────────────
# next.config.ts sets output: "standalone", so .next/standalone contains server.js plus the
# minimal node_modules subset it needs — the full dependency tree never reaches this image.

FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# node:alpine ships a `node` user (uid 1000). The standalone server writes nothing outside
# /tmp, so the application files stay owned by root and read-only to the runtime user.
# No ./public copy: the app has no public/ directory, and COPY of a missing path fails the
# build. Add it back alongside static assets if one is introduced.
COPY --from=builder --chown=root:root /app/.next/standalone ./
COPY --from=builder --chown=root:root /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
