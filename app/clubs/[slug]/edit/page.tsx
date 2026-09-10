import Link from "next/link";
import { redirect } from "next/navigation";
import ClubForm from "@/components/ClubForm";
import ClubLogoUpload from "@/components/ClubLogoUpload";
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
      <div className="mt-6 flex items-start gap-4">
        <ClubLogoUpload
          id={row.id}
          slug={slug}
          name={club.name}
          hasLogo={club.hasLogo}
          className="size-16 text-2xl"
        />
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Edit club page
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Changes are published immediately. The page URL stays the same if
            you update the club name.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ClubForm action={action} club={club} />
      </div>
    </main>
  );
}
