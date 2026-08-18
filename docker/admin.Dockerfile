# syntax=docker/dockerfile:1
# Talpio Admin Panel - Next.js standalone çıktısı
# Bağlam (context) monorepo köküdür.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# --- Bağımlılıklar -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN npm ci --include-workspace-root

# --- Derleme -----------------------------------------------------------------
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/admin ./apps/admin
COPY packages ./packages
RUN npm run build:packages && npm run build --workspace @talpio/admin

# --- Üretim ------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

# standalone çıktısı çalışması için gereken minimum node_modules'ü de içerir
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/admin/server.js"]
