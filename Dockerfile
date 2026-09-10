FROM node:24.20.0-trixie-slim AS base

WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g bun@1.3.14

FROM base AS dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
ENV NODE_ENV=production
# Build-time workers must not connect to the production database.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN bunx prisma generate && bun run build

# Migrations run as a one-shot Compose service before the web container starts.
FROM dependencies AS migrate
RUN groupadd --system --gid 1002 migrate \
    && useradd --system --uid 1002 --gid migrate migrate
COPY --chown=migrate:migrate prisma ./prisma
ENV NODE_ENV=production
USER migrate
CMD ["bunx", "prisma", "migrate", "deploy"]

FROM node:24.20.0-trixie-slim AS runner
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nextjs \
    && useradd --system --uid 1001 --gid nextjs nextjs

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
