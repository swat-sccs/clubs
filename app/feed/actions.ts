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
  offset: number,
  anchorDate: string,
  anchorTime: string,
): Promise<FeedPageResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (view === "following" && !userId) {
    return { posts: [], hasMore: false, hasOlderPosts: false };
  }
  const current = campusNow();
  const safeAnchorDate = /^\d{4}-\d{2}-\d{2}$/.test(anchorDate)
    ? anchorDate
    : current.date;
  const safeAnchorTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(anchorTime)
    ? anchorTime
    : current.time;
  const safeOffset = Number.isFinite(offset)
    ? Math.max(0, Math.floor(offset))
    : 0;
  const browserIdHash = await readRsvpBrowserHash();
  return getFeedPage({
    view: view === "following" ? "following" : "all",
    period: period === "past" ? "past" : "upcoming",
    offset: safeOffset,
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
  if (previous.rsvped) return previous;
  const browserIdHash = await getOrCreateRsvpBrowserHash();
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
