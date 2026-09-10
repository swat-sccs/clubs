"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicClubVisibilityWhere } from "@/lib/data";
import { campusNow } from "@/lib/events";
import {
  getFeedPage,
  type FeedPageResult,
  type FeedPeriod,
  type FeedView,
} from "@/lib/feed";
import {
  getOrCreateRsvpBrowserHash,
  readRsvpBrowserHash,
} from "@/lib/rsvp-browser";
import {
  assertRateLimit,
  opaqueRateLimitIdentifier,
  RateLimitError,
  requestRateLimitIdentifier,
} from "@/lib/rate-limit";

export type RsvpState = {
  count: number;
  rsvped: boolean;
  error: string | null;
};

export type FollowState = {
  following: boolean;
  error: string | null;
  requiresAuth: boolean;
};

export async function loadFeedPosts(
  view: FeedView,
  period: FeedPeriod,
  cursor: string | null,
  anchorDate: string,
  anchorTime: string,
): Promise<FeedPageResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (view === "following" && !userId) {
    return {
      posts: [],
      hasMore: false,
      hasOlderPosts: false,
      nextCursor: null,
    };
  }
  const current = campusNow();
  const safeAnchorDate = /^\d{4}-\d{2}-\d{2}$/.test(anchorDate)
    ? anchorDate
    : current.date;
  const safeAnchorTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(anchorTime)
    ? anchorTime
    : current.time;
  const safeCursor =
    typeof cursor === "string" && cursor.length > 0 && cursor.length <= 128
      ? cursor
      : null;
  try {
    await assertRateLimit({
      action: "feed-page",
      identifier: await requestRateLimitIdentifier(userId),
      limit: 120,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        posts: [],
        hasMore: false,
        hasOlderPosts: false,
        nextCursor: null,
      };
    }
    throw error;
  }
  const browserIdHash = await readRsvpBrowserHash();
  return getFeedPage({
    view: view === "following" ? "following" : "all",
    period: period === "past" ? "past" : "upcoming",
    cursor: safeCursor,
    userId,
    browserIdHash,
    anchorDate: safeAnchorDate,
    anchorTime: safeAnchorTime,
  });
}

export async function setClubFollow(
  clubId: string,
  following: boolean,
): Promise<FollowState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      following: !following,
      error: "Sign in to follow clubs.",
      requiresAuth: true,
    };
  }
  try {
    await assertRateLimit({
      action: "club-follow",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 60,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        following: !following,
        error: "Too many follow changes. Please try again later.",
        requiresAuth: false,
      };
    }
    throw error;
  }

  const club = await prisma.club.findFirst({
    where: { id: clubId, ...publicClubVisibilityWhere() },
    select: { id: true, slug: true },
  });
  if (!club) {
    return {
      following: !following,
      error: "This club is no longer available.",
      requiresAuth: false,
    };
  }

  if (following) {
    await prisma.clubFollow.upsert({
      where: { clubId_userId: { clubId, userId: session.user.id } },
      create: { clubId, userId: session.user.id },
      update: {},
    });
  } else {
    await prisma.clubFollow.deleteMany({
      where: { clubId, userId: session.user.id },
    });
  }

  revalidatePath("/feed");
  revalidatePath("/my-clubs");
  revalidatePath(`/clubs/${club.slug}`);
  revalidatePath("/posts/[postId]", "page");
  return { following, error: null, requiresAuth: false };
}

export async function rsvpToPost(
  postId: string,
  previous: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  void formData;
  const browserIdHash = await getOrCreateRsvpBrowserHash();
  try {
    await Promise.all([
      assertRateLimit({
        action: "post-rsvp-browser",
        identifier: opaqueRateLimitIdentifier("browser", browserIdHash),
        limit: 20,
        windowMs: 60 * 60_000,
      }),
      assertRateLimit({
        action: "post-rsvp-address",
        identifier: await requestRateLimitIdentifier(),
        limit: 30,
        windowMs: 60 * 60_000,
      }),
    ]);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ...previous, error: "Too many RSVP attempts. Try again later." };
    }
    throw error;
  }
  const available = await prisma.clubPost.findFirst({
    where: {
      id: postId,
      moderationStatus: "PUBLISHED",
      club: { is: publicClubVisibilityWhere() },
    },
    select: { id: true },
  });
  if (!available) {
    return { ...previous, error: "This post is no longer available." };
  }

  try {
    if (previous.rsvped) {
      const result = await prisma.$transaction(async (tx) => {
        const removed = await tx.postRsvp.deleteMany({
          where: { postId, browserIdHash },
        });
        if (removed.count === 0) {
          return tx.clubPost.findUnique({
            where: { id: postId },
            select: { rsvpCount: true },
          });
        }
        await tx.clubPost.updateMany({
          where: { id: postId, rsvpCount: { gt: 0 } },
          data: { rsvpCount: { decrement: 1 } },
        });
        return tx.clubPost.findUnique({
          where: { id: postId },
          select: { rsvpCount: true },
        });
      });
      revalidatePath("/feed");
      revalidatePath(`/posts/${postId}`);
      return {
        count: Math.max(0, result?.rsvpCount ?? previous.count - 1),
        rsvped: false,
        error: null,
      };
    }
    const post = await prisma.$transaction(async (tx) => {
      await tx.postRsvp.create({ data: { postId, browserIdHash } });
      return tx.clubPost.update({
        where: { id: postId },
        data: { rsvpCount: { increment: 1 } },
        select: { rsvpCount: true },
      });
    });
    revalidatePath("/feed");
    revalidatePath(`/posts/${postId}`);
    return { count: post.rsvpCount, rsvped: true, error: null };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const post = await prisma.clubPost.findUnique({
        where: { id: postId },
        select: { rsvpCount: true },
      });
      return {
        count: post?.rsvpCount ?? previous.count,
        rsvped: true,
        error: null,
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2025" || error.code === "P2003")
    ) {
      return { ...previous, error: "This post is no longer available." };
    }
    throw error;
  }
}
