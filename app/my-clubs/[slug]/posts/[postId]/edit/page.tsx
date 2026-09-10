import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/PostForm";
import { requireClubEditor } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { updatePost } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit post | Swat Clubs",
};

export default async function EditPostPage(
  props: { params: Promise<{ slug: string; postId: string }> },
) {
  const { slug, postId } = await props.params;
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!club) notFound();
  await requireClubEditor(
    club.id,
    slug,
    `/my-clubs/${slug}/posts/${postId}/edit`,
  );
  const post = await prisma.clubPost.findFirst({
    where: { id: postId, clubId: club.id },
    select: {
      id: true,
      title: true,
      subtitle: true,
      eventDate: true,
      eventTime: true,
      location: true,
      imageObjectKey: true,
    },
  });
  if (!post) notFound();
  const action = updatePost.bind(null, slug, post.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href={`/my-clubs/${slug}/posts`}
        className="text-sm font-medium text-muted-foreground hover:underline"
      >
        ← Manage posts
      </Link>
      <p className="mt-6 text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
        {club.name}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Edit post
      </h1>
      <p className="mt-3 text-lg leading-7 text-muted-foreground">
        Update the event details or replace its photo.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <PostForm
          action={action}
          post={{
            title: post.title,
            subtitle: post.subtitle,
            eventDate: post.eventDate,
            eventTime: post.eventTime,
            location: post.location,
            imageUrl: post.imageObjectKey
              ? `/api/media/posts/${post.id}`
              : null,
          }}
        />
      </div>
    </main>
  );
}
