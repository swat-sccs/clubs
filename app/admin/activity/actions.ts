"use server";

import { requireAdmin } from "@/lib/authorization";
import { getAuditLogPage, type AuditLogPage } from "@/lib/audit-log";

export async function loadAuditLog(
  cursor: string | null,
): Promise<AuditLogPage> {
  await requireAdmin("/admin/activity");
  return getAuditLogPage(cursor);
}
