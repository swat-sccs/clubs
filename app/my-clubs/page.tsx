import Link from "next/link";
import { Pencil } from "lucide-react";
import ClubMonogram from "@/components/ClubMonogram";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My clubs | SCCS Clubs",
  description: "Club pages you can manage.",
};

export default async function MyClubsPage() {
  const session = await requireUser("/my-clubs");
  const clubs = (
    await prisma.clubEditor.findMany({
      where: { userId: session.user.id },
      orderBy: { club: { position: "asc" } },
      select: {
        club: {
          select: { id: true, slug: true, name: true, description: true },
        },
      },
    })
  ).map(({ club }) => club);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
        My clubs
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Club pages assigned to your SCCS account.
      </p>

      {clubs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-6">
          <p className="text-muted-foreground">
            You have not claimed or been assigned any club pages yet. Open an
            existing club to claim it, or request a new club page.
          </p>
          <Link href="/clubs" className="mt-4 inline-block font-medium text-sccs underline">
            Browse clubs
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {clubs.map((club) => (
            <article key={club.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <ClubMonogram name={club.name} className="size-12 text-lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-xl font-semibold">
                    <Link href={`/clubs/${club.slug}`} className="hover:underline">
                      {club.name}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {club.description}
                  </p>
                </div>
              </div>
              <Link
                href={`/clubs/${club.slug}/edit`}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
              >
                <Pencil className="size-4" /> Edit page
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
