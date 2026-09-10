"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import ClubAvatar from "@/components/ClubAvatar";
import ExpandableDescription from "@/components/ExpandableDescription";
import FollowButton from "@/components/FollowButton";
import RelativeEventDate from "@/components/RelativeEventDate";
import RsvpButton from "@/components/RsvpButton";
import { formatEventTime } from "@/lib/events";
import type { FeedPost } from "@/lib/feed";

export default function FeedPostCard({
  post,
  isAuthenticated,
  anchorDate,
  anchorTime,
  onFollowChange,
}: {
  post: FeedPost;
  isAuthenticated: boolean;
  anchorDate: string;
  anchorTime: string;
  onFollowChange: (clubId: string, following: boolean) => void;
}) {
  const postHref = `/posts/${post.id}`;
  const isPast = `${post.eventDate}T${post.eventTime}` < `${anchorDate}T${anchorTime}`;

  return (
    <article
      id={`post-${post.id}`}
      className="flex h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <header className="flex h-16 items-center gap-3 p-3.5">
        <ClubAvatar
          id={post.club.id}
          name={post.club.name}
          hasLogo={post.club.hasLogo}
          className="size-9 text-sm"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/clubs/${post.club.slug}`}
            className="font-heading text-sm font-bold leading-4 text-foreground hover:underline line-clamp-2"
          >
            {post.club.name}
          </Link>
        </div>
        <FollowButton
          clubId={post.club.id}
          initialFollowing={post.club.followed}
          isAuthenticated={isAuthenticated}
          nextPath="/feed"
          compact
          onChange={(following) => onFollowChange(post.club.id, following)}
        />
      </header>

      <Link
        href={postHref}
        aria-label={`Open ${post.title}`}
        className="relative block aspect-square w-full overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {post.imageObjectKey ? (
          <Image
            src={`/api/media/posts/${post.id}`}
            alt={`${post.title} event image`}
            fill
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2.5rem), (max-width: 1279px) calc(33vw - 2.5rem), 288px"
            className="object-cover transition-transform duration-300 hover:scale-[1.015]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <CalendarDays className="size-10 text-sccs/45" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 font-heading text-xl font-bold leading-6 text-foreground line-clamp-2">
            <Link href={postHref} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          {isPast && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Past
            </span>
          )}
        </div>
        <ExpandableDescription text={post.subtitle} />

        <dl className="mt-2 grid gap-2.5 rounded-xl bg-muted/65 p-3 text-sm">
          <div className="flex gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-sccs" />
            <div>
              <dt className="sr-only">Date</dt>
              <dd className="font-medium">
                <RelativeEventDate
                  eventDate={post.eventDate}
                  initialDate={anchorDate}
                />
              </dd>
            </div>
          </div>
          <div className="flex gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-sccs" />
            <div>
              <dt className="sr-only">Time</dt>
              <dd className="font-medium">{formatEventTime(post.eventTime)}</dd>
            </div>
          </div>
          <div className="flex min-w-0 gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-sccs" />
            <div className="min-w-0">
              <dt className="sr-only">Location</dt>
              <dd className="truncate font-medium">{post.location}</dd>
            </div>
          </div>
        </dl>

        <div className="mt-3 flex justify-end">
          <RsvpButton
            postId={post.id}
            count={post.rsvpCount}
            rsvped={post.rsvped}
          />
        </div>
      </div>
    </article>
  );
}
