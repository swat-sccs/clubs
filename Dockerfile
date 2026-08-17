FROM node:24-slim

WORKDIR /app

# openssl is required by the Prisma engine at runtime.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g bun@1

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
# Dummy URL so `next build` never needs a live database; every DB-backed page
# is force-dynamic, so nothing connects during the build.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN bunx prisma generate && bun run build

EXPOSE 3000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
