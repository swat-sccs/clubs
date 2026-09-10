import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

type RateLimitOptions = {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests");
    this.name = "RateLimitError";
  }
}

function hashIdentifier(value: string) {
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_SECRET or AUTH_SECRET must be configured");
  }
  return createHmac("sha256", secret ?? "development-rate-limit-secret")
    .update(value)
    .digest("hex");
}

export async function requestRateLimitIdentifier(userId?: string | null) {
  if (userId) return `user:${hashIdentifier(userId)}`;
  const requestHeaders = await headers();
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";
  const forwarded = trustProxy
    ? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    : null;
  const address = trustProxy
    ? forwarded || requestHeaders.get("x-real-ip") || "unknown"
    : "untrusted-direct-client";
  return `ip:${hashIdentifier(address)}`;
}

export function opaqueRateLimitIdentifier(kind: string, value: string) {
  return `${kind}:${hashIdentifier(value)}`;
}

export async function assertRateLimit({
  action,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions) {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs * 2);
  const counter = await prisma.actionRateLimit.upsert({
    where: {
      action_identifier_windowStart: { action, identifier, windowStart },
    },
    create: { action, identifier, windowStart, expiresAt, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (counter.count === 1 && Math.random() < 0.02) {
    await prisma.actionRateLimit
      .deleteMany({ where: { expiresAt: { lt: new Date(now) } } })
      .catch(() => undefined);
  }
  if (counter.count > limit) {
    throw new RateLimitError(
      Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)),
    );
  }
}
