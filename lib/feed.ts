import "server-only";

import { prisma } from "@/lib/db";
import { publicClubVisibilityWhere } from "@/lib/data";

export const FEED_PAGE_SIZE = 20;

export type FeedView = "all" | "following";
export type FeedPeriod = "upcoming" | "past";

export type FeedPost = {
  id: string;
  title: string;
  subtitle: string;
  imageObjectKey: string | null;
  eventDate: string;
  eventTime: string;
  location: string;
  rsvpCount: number;
  rsvped: boolean;
  club: {
    id: string;
    slug: string;
    name: string;
    hasLogo: boolean;
    followed: boolean;
  };
};

export type FeedPageResult = {
  posts: FeedPost[];
  hasMore: boolean;
  hasOlderPosts: boolean;
  nextCursor: string | null;
};

type FeedPageOptions = {
  cursor: string | null;
  view: FeedView;
  period: FeedPeriod;
  userId: string | null;
  browserIdHash: string | null;
  anchorDate: string;
  anchorTime: string;
};

export async function getFeedPage({
  cursor,
  view,
  period,
  userId,
  browserIdHash,
  anchorDate,
  anchorTime,
}: FeedPageOptions): Promise<FeedPageResult> {
  if (view === "following" && !userId) {
    return {
      posts: [],
      hasMore: false,
      hasOlderPosts: false,
      nextCursor: null,
    };
  }
  const followingOnly = view === "following";
  const clubWhere = {
    ...publicClubVisibilityWhere(),
    ...(followingOnly
      ? { followers: { some: { userId: userId as string } } }
      : {}),
  };
  const baseWhere = {
    moderationStatus: "PUBLISHED" as const,
    club: { is: clubWhere },
  };
  const upcomingWhere = {
    ...baseWhere,
    OR: [
      { eventDate: { gt: anchorDate } },
      { eventDate: anchorDate, eventTime: { gte: anchorTime } },
    ],
  };
  const pastWhere = {
    ...baseWhere,
    OR: [
      { eventDate: { lt: anchorDate } },
      { eventDate: anchorDate, eventTime: { lt: anchorTime } },
    ],
  };
  const select = {
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
  } as const;

  const activeWhere = period === "upcoming" ? upcomingWhere : pastWhere;
  const [pageRows, olderPost] = await Promise.all([
    prisma.clubPost.findMany({
      where: activeWhere,
      orderBy:
        period === "upcoming"
          ? [
              { eventDate: "asc" as const },
              { eventTime: "asc" as const },
              { createdAt: "asc" as const },
              { id: "asc" as const },
            ]
          : [
              { eventDate: "desc" as const },
              { eventTime: "desc" as const },
              { createdAt: "desc" as const },
              { id: "desc" as const },
            ],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: FEED_PAGE_SIZE + 1,
      select,
    }),
    period === "upcoming"
      ? prisma.clubPost.findFirst({ where: pastWhere, select: { id: true } })
      : Promise.resolve(null),
  ]);
  const hasMore = pageRows.length > FEED_PAGE_SIZE;
  const rows = hasMore ? pageRows.slice(0, FEED_PAGE_SIZE) : pageRows;

  const posts = rows.map((post) => ({
    id: post.id,
    title: post.title,
    subtitle: post.subtitle,
    imageObjectKey: post.imageObjectKey,
    eventDate: post.eventDate,
    eventTime: post.eventTime,
    location: post.location,
    rsvpCount: post.rsvpCount,
    rsvped: post.rsvps.length > 0,
    club: {
      id: post.club.id,
      slug: post.club.slug,
      name: post.club.name,
      hasLogo: Boolean(post.club.logoObjectKey),
      followed: post.club.followers.length > 0,
    },
  }));

  return {
    posts,
    hasMore,
    hasOlderPosts: Boolean(olderPost),
    nextCursor: hasMore ? (posts.at(-1)?.id ?? null) : null,
  };
}
