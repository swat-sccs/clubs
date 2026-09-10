import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/PostForm";
import { requireClubEditor } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { createPost } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create a post | Swat Clubs",
};

export default async function NewPostPage(
  props: PageProps<"/my-clubs/[slug]/posts/new">,
) {
  const { slug } = await props.params;
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!club) notFound();
  await requireClubEditor(club.id, slug, `/my-clubs/${slug}/posts/new`);
  const action = createPost.bind(null, slug);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/my-clubs" className="text-sm font-medium text-muted-foreground hover:underline">
        ← My clubs
      </Link>
      <p className="mt-6 text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
        {club.name}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Make a post
      </h1>
      <p className="mt-3 text-lg leading-7 text-muted-foreground">
        Share an event or opportunity in the club feed. Posts publish immediately.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <PostForm action={action} />
      </div>
    </main>
  );
}
