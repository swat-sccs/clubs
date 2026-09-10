import Link from "next/link";
import AdminAuditLog from "@/components/AdminAuditLog";
import { getAuditLogPage } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const UPDATED_PAGE_SIZE = 8;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function activityHref(updatedPage: number) {
  const params = new URLSearchParams();
  if (updatedPage > 1) params.set("updatedPage", String(updatedPage));
  const query = params.toString();
  return query ? `/admin/activity?${query}` : "/admin/activity";
}

export default async function AdminActivityPage(
  props: PageProps<"/admin/activity">,
) {
  await requireAdmin("/admin/activity");
  const searchParams = await props.searchParams;
  const requestedPage = pageNumber(searchParams.updatedPage);
  const updatedCount = await prisma.club.count();
  const updatedTotalPages = Math.max(
    1,
    Math.ceil(updatedCount / UPDATED_PAGE_SIZE),
  );
  const updatedPage = Math.min(requestedPage, updatedTotalPages);
  const [activity, recentlyUpdated] = await Promise.all([
    getAuditLogPage(),
    prisma.club.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (updatedPage - 1) * UPDATED_PAGE_SIZE,
      take: UPDATED_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        updatedAt: true,
        updatedBy: true,
      },
    }),
  ]);

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8">
      <section>
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Audit log
        </h2>
        <p className="mt-2 text-muted-foreground">
          Append-only history of profile changes, moderation decisions, and access changes.
        </p>
        <AdminAuditLog initialPage={activity} />
      </section>

      <aside>
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Recently updated
        </h2>
        <p className="mt-2 text-muted-foreground">
          Current database timestamps, including changes from before audit logging.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <ol
            id="recently-updated-list"
            className="max-h-96 divide-y divide-border overflow-y-auto overscroll-contain scroll-smooth"
          >
            {recentlyUpdated.map((club) => (
              <li key={club.id} className="p-4">
                <Link
                  href={`/clubs/${club.slug}`}
                  className="font-heading font-semibold text-foreground hover:underline"
                >
                  {club.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {club.updatedAt.toLocaleString()}
                  {club.updatedBy ? ` · ${club.updatedBy}` : ""}
                </p>
              </li>
            ))}
          </ol>
          {updatedTotalPages > 1 && (
            <nav
              className="flex items-center justify-between gap-2 border-t border-border p-3"
              aria-label="Recently updated pages"
              aria-controls="recently-updated-list"
            >
              {updatedPage > 1 ? (
                <Link
                  href={activityHref(updatedPage - 1)}
                  scroll={false}
                  className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
                >
                  ← Prev
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground opacity-50">← Prev</span>
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {updatedPage} / {updatedTotalPages}
              </span>
              {updatedPage < updatedTotalPages ? (
                <Link
                  href={activityHref(updatedPage + 1)}
                  scroll={false}
                  className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground opacity-50">Next →</span>
              )}
            </nav>
          )}
        </div>
      </aside>
    </main>
  );
}
