import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import ClubAvatar from "@/components/ClubAvatar";
import FollowButton from "@/components/FollowButton";
import RsvpButton from "@/components/RsvpButton";
import { auth } from "@/lib/auth";
import { publicClubVisibilityWhere } from "@/lib/data";
import { prisma } from "@/lib/db";
import { formatEventDate, formatEventTime } from "@/lib/events";
import { readRsvpBrowserHash } from "@/lib/rsvp-browser";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/posts/[postId]">,
): Promise<Metadata> {
  const { postId } = await props.params;
  const post = await prisma.clubPost.findFirst({
    where: {
      id: postId,
      moderationStatus: "PUBLISHED",
      club: { is: publicClubVisibilityWhere() },
    },
    select: { title: true, subtitle: true, club: { select: { name: true } } },
  });
  if (!post) return { title: "Post not found | Swat Clubs" };
  return {
    title: `${post.title} | ${post.club.name}`,
    description: post.subtitle.slice(0, 160),
  };
}

export default async function PostPage(props: PageProps<"/posts/[postId]">) {
  const { postId } = await props.params;
  const [session, browserIdHash] = await Promise.all([
    auth(),
    readRsvpBrowserHash(),
  ]);
  const userId = session?.user?.id ?? null;
  const post = await prisma.clubPost.findFirst({
    where: {
      id: postId,
      moderationStatus: "PUBLISHED",
      club: { is: publicClubVisibilityWhere() },
    },
    select: {
      id: true,
      title: true,
      subtitle: true,
      imageObjectKey: true,
      eventDate: true,
      eventTime: true,
      location: true,
      rsvpCount: true,
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoObjectKey: true,
          followers: {
            where: { userId: userId ?? "" },
            select: { id: true },
            take: 1,
          },
        },
      },
      rsvps: {
        where: browserIdHash ? { browserIdHash } : { id: "" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        href="/feed"
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Back to feed
      </Link>

      <article className="mt-5 grid gap-5 sm:mt-6 sm:gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] xl:items-start">
        {post.imageObjectKey ? (
          <div className="relative order-2 aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm md:mx-auto md:w-full md:max-w-3xl xl:order-none xl:aspect-[4/5] xl:max-w-none">
            <Image
              src={`/api/media/posts/${post.id}`}
              alt={`${post.title} event image`}
              fill
              sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) calc(100vw - 3rem), 650px"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="order-2 flex aspect-square items-center justify-center rounded-2xl bg-muted md:mx-auto md:w-full md:max-w-3xl xl:order-none xl:aspect-[4/5] xl:max-w-none">
            <CalendarDays className="size-16 text-sccs/40" />
          </div>
        )}

        <div className="contents xl:sticky xl:top-28 xl:block">
          <div className="order-1">
            <div className="flex items-center gap-3">
              <ClubAvatar
                id={post.club.id}
                name={post.club.name}
                hasLogo={Boolean(post.club.logoObjectKey)}
                className="size-11 text-base"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/clubs/${post.club.slug}`}
                  className="font-heading font-bold leading-5 hover:underline line-clamp-2"
                >
                  {post.club.name}
                </Link>
              </div>
              <FollowButton
                clubId={post.club.id}
                initialFollowing={post.club.followers.length > 0}
                isAuthenticated={Boolean(userId)}
                nextPath={`/posts/${post.id}`}
                compact
              />
            </div>

            <h1 className="mt-5 font-heading text-3xl font-bold leading-tight text-foreground sm:mt-7 sm:text-4xl">
              {post.title}
            </h1>
          </div>

          <div className="order-3">
            <p className="whitespace-pre-wrap text-base leading-7 text-foreground/80 sm:text-lg sm:leading-8 xl:mt-4">
              {post.subtitle}
            </p>

            <dl className="mt-6 grid gap-4 rounded-2xl bg-muted/65 p-4 text-sm sm:grid-cols-2 sm:p-5 xl:grid-cols-1">
              <div className="flex min-w-0 gap-2.5">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-sccs" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Date
                  </dt>
                  <dd className="mt-0.5 font-semibold break-words">
                    {formatEventDate(post.eventDate)}
                  </dd>
                </div>
              </div>
              <div className="flex min-w-0 gap-2.5">
                <Clock3 className="mt-0.5 size-5 shrink-0 text-sccs" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Time
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {formatEventTime(post.eventTime)}
                  </dd>
                </div>
              </div>
              <div className="flex min-w-0 gap-2.5 sm:col-span-2 xl:col-span-1">
                <MapPin className="mt-0.5 size-5 shrink-0 text-sccs" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Location
                  </dt>
                  <dd className="mt-0.5 font-semibold break-words">
                    {post.location}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-6 flex justify-end xl:justify-start">
              <RsvpButton
                postId={post.id}
                count={post.rsvpCount}
                rsvped={post.rsvps.length > 0}
              />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
