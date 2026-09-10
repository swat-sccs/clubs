import Link from "next/link";
import { Prisma } from "@prisma/client";
import AdminAssignmentSearch from "@/components/AdminAssignmentSearch";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { UNCLAIMED_CLUB_GRACE_PERIOD_DAYS } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function assignmentsHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/assignments?${search}` : "/admin/assignments";
}

function editorLabel(editor: {
  name: string | null;
  email: string | null;
  username: string | null;
}) {
  return editor.name ?? editor.email ?? editor.username ?? "Unknown SCCS user";
}

export default async function AdminAssignmentsPage(
  props: PageProps<"/admin/assignments">,
) {
  await requireAdmin("/admin/assignments");
  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q)?.trim().slice(0, 120) ?? "";
  const requestedPage = pageNumber(searchParams.page);
  const hiddenCutoff = new Date();
  hiddenCutoff.setDate(
    hiddenCutoff.getDate() - UNCLAIMED_CLUB_GRACE_PERIOD_DAYS,
  );
  const where: Prisma.ClubWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          {
            editors: {
              some: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { username: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      }
    : {};
  const clubCount = await prisma.club.count({ where });
  const totalPages = Math.max(1, Math.ceil(clubCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const clubs = await prisma.club.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      slug: true,
      name: true,
      createdAt: true,
      editors: {
        orderBy: { grantedAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          grantedAt: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h2 className="font-heading text-2xl font-semibold text-foreground">
        Users assigned to clubs
      </h2>
      <p className="mt-2 text-muted-foreground">
        Unclaimed clubs disappear from public pages after {UNCLAIMED_CLUB_GRACE_PERIOD_DAYS} days,
        but remain available here and in the database.
      </p>

      <AdminAssignmentSearch initialQuery={query} />

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {clubCount === 0
          ? "No matching clubs or users."
          : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, clubCount)} of ${clubCount} clubs`}
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left">
            <thead className="bg-muted/70 text-sm text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Club</th>
                <th className="px-5 py-3 font-semibold">Assigned users</th>
                <th className="px-5 py-3 font-semibold">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clubs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">
                    Try a different search.
                  </td>
                </tr>
              )}
              {clubs.map((club) => {
                const hidden =
                  club.editors.length === 0 && club.createdAt < hiddenCutoff;
                return (
                  <tr key={club.id} className="align-top">
                    <td className="px-5 py-4">
                      <Link
                        href={`/clubs/${club.slug}`}
                        className="font-heading font-semibold text-foreground hover:underline"
                      >
                        {club.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {club.editors.length === 0 ? (
                        <span className="text-muted-foreground">Unclaimed</span>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {club.editors.map((editor) => (
                            <li key={editor.id}>
                              <p className="font-medium text-foreground">
                                {editorLabel(editor)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[editor.username ? `@${editor.username}` : null, editor.email]
                                  .filter(Boolean)
                                  .join(" · ")}
                                {` · since ${editor.grantedAt.toLocaleDateString()}`}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          hidden
                            ? "rounded-full bg-red-600/10 px-3 py-1 text-sm font-semibold text-red-700"
                            : "rounded-full bg-green-600/10 px-3 py-1 text-sm font-semibold text-green-700"
                        }
                      >
                        {hidden ? "Hidden" : "Public"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-5 flex items-center justify-between gap-4"
          aria-label="Club assignment pages"
        >
          {currentPage > 1 ? (
            <Link
              href={assignmentsHref(query, currentPage - 1)}
              className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 font-semibold text-foreground hover:bg-muted"
            >
              ← Previous
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center rounded-xl border border-border px-4 font-semibold text-muted-foreground opacity-50">
              ← Previous
            </span>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={assignmentsHref(query, currentPage + 1)}
              className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 font-semibold text-foreground hover:bg-muted"
            >
              Next →
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center rounded-xl border border-border px-4 font-semibold text-muted-foreground opacity-50">
              Next →
            </span>
          )}
        </nav>
      )}
    </main>
  );
}
