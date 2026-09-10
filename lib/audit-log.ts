import "server-only";

import { prisma } from "@/lib/db";

const AUDIT_PAGE_SIZE = 25;

export type AuditLogEntry = {
  id: string;
  clubName: string;
  clubSlug: string | null;
  action: string;
  summary: string;
  actor: string | null;
  actorEmail: string | null;
  createdAt: string;
  createdAtLabel: string;
};

export type AuditLogPage = {
  entries: AuditLogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function getAuditLogPage(
  cursor: string | null = null,
): Promise<AuditLogPage> {
  const safeCursor =
    typeof cursor === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(cursor)
      ? cursor
      : null;
  const rows = await prisma.clubAuditLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(safeCursor ? { cursor: { id: safeCursor }, skip: 1 } : {}),
    take: AUDIT_PAGE_SIZE + 1,
    include: { club: { select: { slug: true } } },
  });
  const hasMore = rows.length > AUDIT_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, AUDIT_PAGE_SIZE) : rows;

  return {
    entries: pageRows.map((entry) => ({
      id: entry.id,
      clubName: entry.clubName,
      clubSlug: entry.club?.slug ?? null,
      action: entry.action,
      summary: entry.summary,
      actor: entry.actor,
      actorEmail: entry.actorEmail,
      createdAt: entry.createdAt.toISOString(),
      createdAtLabel: entry.createdAt.toLocaleString(),
    })),
    nextCursor: hasMore ? pageRows.at(-1)?.id ?? null : null,
    hasMore,
  };
}
