# syntax=docker/dockerfile:1
# Talpio Web - Next.js standalone çıktısı
# Bağlam (context) monorepo köküdür.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS deps
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
COPY packages ./packages
RUN npm ci --include-workspace-root

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/web ./apps/web
COPY packages ./packages
RUN npm run build:packages && npm run build --workspace @talpio/web

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
