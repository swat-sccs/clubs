import { Prisma } from "@prisma/client";
import Link from "next/link";
import AdminAccessForm from "@/components/AdminAccessForm";
import AdminUserSearch from "@/components/AdminUserSearch";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

type UserSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function usersHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/users?${search}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<UserSearchParams>;
}) {
  const session = await requireAdmin("/admin/users");
  const params = await searchParams;
  const query = firstValue(params.q)?.trim().slice(0, 120) ?? "";
  const requestedPage = pageNumber(params.page);
  const where: Prisma.AppUserWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};
  const userCount = await prisma.appUser.count({ where });
  const totalPages = Math.max(1, Math.ceil(userCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const users = await prisma.appUser.findMany({
    where,
    orderBy: [{ lastSignedInAt: "desc" }, { id: "asc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isDirectoryAdmin: true,
      isAppAdmin: true,
      firstSignedInAt: true,
      lastSignedInAt: true,
    },
  });
  const assignments = users.length
    ? await prisma.clubEditor.findMany({
        where: { userId: { in: users.map((user) => user.id) } },
        orderBy: [{ club: { name: "asc" } }, { role: "asc" }],
        select: {
          userId: true,
          role: true,
          club: { select: { name: true, slug: true } },
        },
      })
    : [];
  const assignmentsByUser = Map.groupBy(assignments, (assignment) => assignment.userId);
  const resultStart = userCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, userCount);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Users</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            People appear here after signing in with SCCS. Administrator access can
            come from the SCCS staff group or an app-specific grant.
          </p>
        </div>
        <Link
          href="/admin/assignments"
          className="font-semibold text-sccs underline underline-offset-4"
        >
          Manage club roles
        </Link>
      </div>

      <div className="mt-8">
        <AdminUserSearch initialQuery={query} />
        <p className="text-sm text-muted-foreground">
          {userCount === 0
            ? "No matching signed-in users."
            : `Showing ${resultStart}–${resultEnd} of ${userCount} users`}
        </p>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-heading text-xl font-semibold">No users found</h2>
            <p className="mt-2 text-muted-foreground">
              Users will be recorded when they next sign in to the app.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((user) => {
              const clubRoles = assignmentsByUser.get(user.id) ?? [];
              const hasAdminRole = user.isDirectoryAdmin || user.isAppAdmin;
              return (
                <li
                  key={user.id}
                  className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-semibold text-foreground">
                      {user.name ?? user.username ?? user.email ?? "SCCS user"}
                    </p>
                    {user.username && (
                      <p className="truncate text-sm font-medium text-foreground/75">
                        @{user.username}
                      </p>
                    )}
                    {user.email && (
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      First signed in {user.firstSignedInAt.toLocaleDateString()} · Last signed in{" "}
                      {user.lastSignedInAt.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Roles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.isDirectoryAdmin && (
                        <span className="rounded-full bg-sccs/10 px-3 py-1 text-xs font-semibold text-sccs">
                          Admin · SCCS group
                        </span>
                      )}
                      {user.isAppAdmin && (
                        <span className="rounded-full bg-sccs-orange/25 px-3 py-1 text-xs font-semibold text-sccs-ink">
                          Admin · App grant
                        </span>
                      )}
                      {clubRoles.map((assignment) => (
                        <Link
                          key={`${assignment.club.slug}:${assignment.role}`}
                          href={`/clubs/${assignment.club.slug}`}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground hover:underline"
                        >
                          {assignment.role === "OWNER" ? "Owner" : "Editor"} · {assignment.club.name}
                        </Link>
                      ))}
                      {!hasAdminRole && clubRoles.length === 0 && (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          User
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {user.id === session.user.id ? (
                      <p className="text-sm font-medium text-muted-foreground">Your account</p>
                    ) : user.isAppAdmin ? (
                      <AdminAccessForm userId={user.id} isAppAdmin />
                    ) : user.isDirectoryAdmin ? (
                      <p className="max-w-48 text-sm text-muted-foreground">
                        Managed by SCCS group
                      </p>
                    ) : (
                      <AdminAccessForm userId={user.id} isAppAdmin={false} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="User pages">
          {currentPage > 1 ? (
            <Link
              href={usersHref(query, currentPage - 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={usersHref(query, currentPage + 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
