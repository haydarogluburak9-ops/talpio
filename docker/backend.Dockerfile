# syntax=docker/dockerfile:1
# Talpio API - çok aşamalı derleme
# Bağlam (context) monorepo köküdür.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# --- Bağımlılıklar -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN npm ci --include-workspace-root

# --- Derleme -----------------------------------------------------------------
FROM deps AS build
COPY apps/backend ./apps/backend
COPY packages ./packages
RUN npm run build:packages && npm run build --workspace @talpio/backend

# --- Yalnızca üretim bağımlılıkları -------------------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
RUN npm ci --workspace @talpio/backend --include-workspace-root --omit=dev

# --- Geliştirme (hot reload) --------------------------------------------------
FROM deps AS development
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start:dev"]

# --- Üretim ------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY apps/backend/package.json ./apps/backend/
COPY package.json ./

# Root olmayan kullanıcı ile çalıştır
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs talpio \
    && chown -R talpio:nodejs /app
USER talpio

WORKDIR /app/apps/backend
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
