import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Pencil, Plus } from "lucide-react";
import { requireClubEditor } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  campusNow,
  formatCompactEventDate,
  formatEventTime,
} from "@/lib/events";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage posts | Swat Clubs",
};

export default async function ManagePostsPage(
  props: PageProps<"/my-clubs/[slug]/posts">,
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const moderationMessage =
    searchParams.submitted === "pending" || searchParams.updated === "pending"
      ? "Your post is under review because an automated safety check flagged content that may violate the Terms of Service. It is not public yet."
      : searchParams.updated === "published"
        ? "Your changes are live."
        : null;
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!club) notFound();
  await requireClubEditor(club.id, slug, `/my-clubs/${slug}/posts`);

  const posts = await prisma.clubPost.findMany({
    where: { clubId: club.id },
    select: {
      id: true,
      title: true,
      subtitle: true,
      eventDate: true,
      eventTime: true,
      location: true,
      imageObjectKey: true,
      rsvpCount: true,
      moderationStatus: true,
      moderationReason: true,
      moderationNote: true,
    },
  });
  const now = campusNow();
  const currentKey = `${now.date}T${now.time}`;
  posts.sort((a, b) => {
    const aKey = `${a.eventDate}T${a.eventTime}`;
    const bKey = `${b.eventDate}T${b.eventTime}`;
    const aPast = aKey < currentKey;
    const bPast = bKey < currentKey;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey);
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/my-clubs" className="text-sm font-medium text-muted-foreground hover:underline">
        ← My clubs
      </Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
            {club.name}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Manage posts
          </h1>
        </div>
        <Link
          href={`/my-clubs/${slug}/posts/new`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
        >
          <Plus className="size-4" /> Make a post
        </Link>
      </div>

      {moderationMessage && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-sccs-orange/40 bg-sccs-orange/10 p-4 leading-6 text-foreground"
        >
          {moderationMessage}
        </p>
      )}

      {posts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <CalendarDays className="mx-auto size-7 text-sccs" />
          <p className="mt-3 font-medium text-foreground">This club has no posts yet.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {posts.map((post) => {
            const isPast = `${post.eventDate}T${post.eventTime}` < currentKey;
            return (
              <article
                key={post.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                {post.imageObjectKey ? (
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-36">
                    <Image
                      src={`/api/media/posts/${post.id}`}
                      alt=""
                      fill
                      unoptimized
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center rounded-xl bg-muted text-sccs sm:w-36">
                    <CalendarDays className="size-7" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-xl font-bold text-foreground">
                      {post.title}
                    </h2>
                    {isPast && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        Past
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        post.moderationStatus === "PUBLISHED" &&
                          "bg-green-600/10 text-green-800",
                        post.moderationStatus === "PENDING_REVIEW" &&
                          "bg-amber-500/15 text-amber-900",
                        post.moderationStatus === "DENIED" &&
                          "bg-destructive/10 text-destructive",
                      )}
                    >
                      {post.moderationStatus === "PUBLISHED"
                        ? "Approved"
                        : post.moderationStatus === "PENDING_REVIEW"
                          ? "Pending review"
                          : "Denied"}
                    </span>
                  </div>
                  {post.moderationStatus === "PENDING_REVIEW" && (
                    <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-950">
                      {post.moderationReason ??
                        "This post is awaiting administrator review."}{" "}
                      It is not visible in the feed.
                    </p>
                  )}
                  {post.moderationStatus === "DENIED" && (
                    <p className="mt-3 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      <span className="font-semibold">Review note:</span>{" "}
                      {post.moderationNote ||
                        "No note was provided. Edit the post to submit it again."}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {post.subtitle}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/75">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {formatCompactEventDate(post.eventDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-4" /> {formatEventTime(post.eventTime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" /> {post.location}
                    </span>
                    <span>{post.rsvpCount} RSVP{post.rsvpCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <Link
                  href={`/my-clubs/${slug}/posts/${post.id}/edit`}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 font-semibold text-foreground hover:bg-muted"
                >
                  <Pencil className="size-4" /> Edit
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
