import "server-only";

import { prisma } from "@/lib/db";
import { campusNow } from "@/lib/events";

const DAY_MS = 86_400_000;
const CAMPUS_TIME_ZONE = "America/New_York";

export const ANALYTICS_RANGES = [30, 60, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type DailyActivityPoint = {
  date: string;
  label: string;
  posts: number;
  rsvps: number;
};

export type ClubEngagementPoint = {
  id: string;
  name: string;
  slug: string;
  posts: number;
  rsvps: number;
};

export type AdminAnalytics = {
  rangeDays: AnalyticsRange;
  totalPosts: number;
  totalRsvps: number;
  postingClubs: number;
  averageRsvpsPerPost: number;
  trend: DailyActivityPoint[];
  topClubs: ClubEngagementPoint[];
};

function campusDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function trendDateKeys(rangeDays: AnalyticsRange) {
  const campusDate = campusNow().date;
  const anchor = Date.parse(`${campusDate}T12:00:00Z`);
  return Array.from({ length: rangeDays }, (_, index) =>
    new Date(anchor - (rangeDays - index - 1) * DAY_MS)
      .toISOString()
      .slice(0, 10),
  );
}

export async function getAdminAnalytics(
  rangeDays: AnalyticsRange,
): Promise<AdminAnalytics> {
  // One extra UTC day ensures the first campus-local day is included around
  // daylight-saving boundaries; points outside the exact keys are discarded.
  const recentCutoff = new Date(Date.now() - (rangeDays + 1) * DAY_MS);
  const [totalPosts, totalRsvps, recentPosts, recentRsvps, byClub] =
    await Promise.all([
      prisma.clubPost.count(),
      prisma.postRsvp.count(),
      prisma.clubPost.findMany({
        where: { createdAt: { gte: recentCutoff } },
        select: { createdAt: true },
      }),
      prisma.postRsvp.findMany({
        where: { createdAt: { gte: recentCutoff } },
        select: { createdAt: true },
      }),
      prisma.clubPost.groupBy({
        by: ["clubId"],
        _count: { id: true },
        _sum: { rsvpCount: true },
      }),
    ]);

  const dateKeys = trendDateKeys(rangeDays);
  const points = new Map(
    dateKeys.map((date) => [date, { posts: 0, rsvps: 0 }]),
  );
  for (const post of recentPosts) {
    const point = points.get(campusDateKey(post.createdAt));
    if (point) point.posts += 1;
  }
  for (const rsvp of recentRsvps) {
    const point = points.get(campusDateKey(rsvp.createdAt));
    if (point) point.rsvps += 1;
  }

  const rankedClubs = byClub
    .map((row) => ({
      id: row.clubId,
      posts: row._count.id,
      rsvps: row._sum.rsvpCount ?? 0,
    }))
    .sort((a, b) => b.rsvps - a.rsvps || b.posts - a.posts)
    .slice(0, 8);
  const clubs = rankedClubs.length
    ? await prisma.club.findMany({
        where: { id: { in: rankedClubs.map((club) => club.id) } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const clubsById = new Map(clubs.map((club) => [club.id, club]));

  return {
    rangeDays,
    totalPosts,
    totalRsvps,
    postingClubs: byClub.length,
    averageRsvpsPerPost: totalPosts === 0 ? 0 : totalRsvps / totalPosts,
    trend: dateKeys.map((date) => ({
      date,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`)),
      posts: points.get(date)?.posts ?? 0,
      rsvps: points.get(date)?.rsvps ?? 0,
    })),
    topClubs: rankedClubs.flatMap((point) => {
      const club = clubsById.get(point.id);
      return club ? [{ ...point, name: club.name, slug: club.slug }] : [];
    }),
  };
}
