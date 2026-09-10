import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { UNCLAIMED_CLUB_GRACE_PERIOD_DAYS } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin("/admin");
  const hiddenCutoff = new Date();
  hiddenCutoff.setDate(
    hiddenCutoff.getDate() - UNCLAIMED_CLUB_GRACE_PERIOD_DAYS,
  );

  const [clubCount, editorCount, pendingCreations, pendingClaims, hiddenCount, activity] =
    await Promise.all([
      prisma.club.count(),
      prisma.clubEditor.count(),
      prisma.clubCreationRequest.count({ where: { status: "PENDING" } }),
      prisma.clubClaimRequest.count({ where: { status: "PENDING" } }),
      prisma.club.count({
        where: { editors: { none: {} }, createdAt: { lt: hiddenCutoff } },
      }),
      prisma.clubAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          clubName: true,
          action: true,
          actor: true,
          createdAt: true,
          club: { select: { slug: true } },
        },
      }),
    ]);

  const cards = [
    ["Clubs", clubCount],
    ["Editor assignments", editorCount],
    ["Pending requests", pendingCreations + pendingClaims],
    ["Hidden unclaimed", hiddenCount],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Recent activity</h2>
            <p className="mt-1 text-muted-foreground">
              Club profile changes and access grants.
            </p>
          </div>
          <Link href="/admin/activity" className="font-semibold text-sccs underline">
            View full activity
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No recorded activity yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {entry.club ? (
                      <Link href={`/clubs/${entry.club.slug}`} className="hover:underline">
                        {entry.clubName}
                      </Link>
                    ) : (
                      entry.clubName
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.action.replaceAll("_", " ")} · {entry.actor ?? "System"}
                  </p>
                </div>
                <time className="text-sm text-muted-foreground">
                  {entry.createdAt.toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
