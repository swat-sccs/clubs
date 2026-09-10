import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import AdminClubAssignmentsPanel from "@/components/AdminClubAssignmentsPanel";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { isClubPublic } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminAssignmentsPage(
  props: PageProps<"/admin/assignments">,
) {
  await requireAdmin("/admin/assignments");
  const searchParams = await props.searchParams;
  const savedTab = (await cookies()).get("admin-club-panel-tab")?.value;
  const initialTab = savedTab === "users" ? "users" : "preview";
  const query = firstValue(searchParams.q)?.trim().slice(0, 120) ?? "";
  const requestedPage = pageNumber(searchParams.page);
  const where: Prisma.ClubWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          {
            editors: {
              some: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
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
      visibilityOverride: true,
      editors: {
        orderBy: { grantedAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          grantedAt: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto h-[calc(100dvh-5rem)] w-full max-w-7xl overflow-hidden px-4 pb-4 pt-4 sm:h-[calc(100dvh-6rem)] sm:px-6 lg:px-8">
      <AdminClubAssignmentsPanel
        initialTab={initialTab}
        initialQuery={query}
        resultLabel={
          clubCount === 0
            ? "No matching clubs or users."
            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, clubCount)} of ${clubCount} clubs`
        }
        currentPage={currentPage}
        totalPages={totalPages}
        clubs={clubs.map((club) => ({
          id: club.id,
          slug: club.slug,
          name: club.name,
          visibility: isClubPublic(club) ? "Public" : "Hidden",
          users: club.editors.map((editor) => ({
            ...editor,
            grantedAtLabel: editor.grantedAt.toLocaleDateString(),
          })),
        }))}
      />
    </main>
  );
}
