import Link from "next/link";
import { redirect } from "next/navigation";
import ClubForm from "@/components/ClubForm";
import { requireClubEditor } from "@/lib/authorization";
import { getClubBySlug } from "@/lib/data";
import { prisma } from "@/lib/db";
import { updateClub } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditClubPage(
  props: PageProps<"/clubs/[slug]/edit">,
) {
  const { slug } = await props.params;
  const [club, row] = await Promise.all([
    getClubBySlug(slug, { includeHidden: true }),
    prisma.club.findUnique({ where: { slug }, select: { id: true } }),
  ]);
  if (!club || !row) redirect("/clubs");
  await requireClubEditor(row.id, slug);
  const action = updateClub.bind(null, slug);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link href={`/clubs/${slug}`} className="text-sm font-medium text-muted-foreground hover:underline">
        ← {club.name}
      </Link>
      <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">
        Edit club page
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Changes are published immediately. The page URL stays the same if you
        update the club name.
      </p>
      <div className="mt-8">
        <ClubForm action={action} club={club} />
      </div>
    </main>
  );
}
