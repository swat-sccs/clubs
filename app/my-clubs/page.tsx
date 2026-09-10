import Link from "next/link";
import { ListChecks, Pencil, Plus } from "lucide-react";
import ClubAvatar from "@/components/ClubAvatar";
import { requireUser } from "@/lib/authorization";
import { publicClubVisibilityWhere } from "@/lib/data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My clubs | SCCS Clubs",
  description: "Club pages you manage and clubs you follow.",
};

export default async function MyClubsPage() {
  const session = await requireUser("/my-clubs");
  const [managedRows, followedRows] = await Promise.all([
    prisma.clubEditor.findMany({
      where: { userId: session.user.id },
      orderBy: { club: { position: "asc" } },
      select: {
        club: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            logoObjectKey: true,
            _count: { select: { posts: true } },
          },
        },
      },
    }),
    prisma.clubFollow.findMany({
      where: {
        userId: session.user.id,
        club: { is: publicClubVisibilityWhere() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        club: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            logoObjectKey: true,
          },
        },
      },
    }),
  ]);
  const managedClubs = managedRows.map(({ club }) => club);
  const followedClubs = followedRows.map(({ club }) => club);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
        My clubs
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Club pages you manage and clubs you follow.
      </p>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Managed clubs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can edit these pages and publish posts for them.
        </p>
        {managedClubs.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6">
            <p className="text-muted-foreground">
              You have not claimed or been assigned any club pages yet.
            </p>
            <Link href="/clubs" className="mt-3 inline-block font-medium text-sccs underline">
              Browse clubs
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {managedClubs.map((club) => (
              <article key={club.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <ClubAvatar
                    id={club.id}
                    name={club.name}
                    hasLogo={Boolean(club.logoObjectKey)}
                    className="size-12 text-lg"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-xl font-semibold">
                      <Link href={`/clubs/${club.slug}`} className="hover:underline">
                        {club.name}
                      </Link>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {club.description}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {club._count.posts} {club._count.posts === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/my-clubs/${club.slug}/posts/new`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
                  >
                    <Plus className="size-4" /> Make a post
                  </Link>
                  <Link
                    href={`/clubs/${club.slug}/edit`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 font-medium text-foreground hover:bg-muted"
                  >
                    <Pencil className="size-4" /> Edit page
                  </Link>
                  <Link
                    href={`/my-clubs/${club.slug}/posts`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 font-medium text-foreground hover:bg-muted"
                  >
                    <ListChecks className="size-4" /> Manage posts
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-bold text-foreground">Following</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Posts from these clubs can be isolated with the Following feed filter.
        </p>
        {followedClubs.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6">
            <p className="text-muted-foreground">You are not following any clubs yet.</p>
            <Link href="/clubs" className="mt-3 inline-block font-medium text-sccs underline">
              Find clubs to follow
            </Link>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {followedClubs.map((club) => (
              <li key={club.id}>
                <Link
                  href={`/clubs/${club.slug}`}
                  className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/55"
                >
                  <ClubAvatar
                    id={club.id}
                    name={club.name}
                    hasLogo={Boolean(club.logoObjectKey)}
                    className="size-11 text-base"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-heading font-bold text-foreground">
                      {club.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {club.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
