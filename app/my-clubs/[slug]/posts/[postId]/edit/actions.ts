"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostFormState } from "@/app/my-clubs/[slug]/posts/new/actions";
import { requireClubEditor } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { parseEventFields } from "@/lib/events";
import {
  moderatePostImage,
  moderatePostText,
  moderateStoredPostImage,
  moderationReason,
} from "@/lib/post-moderation";
import { uploadImage, validateImage } from "@/lib/storage";
import {
  attemptQueuedImageDeletion,
  discardDetachedImage,
  queueImageDeletion,
} from "@/lib/storage-cleanup";
import {
  assertRateLimit,
  RateLimitError,
  requestRateLimitIdentifier,
} from "@/lib/rate-limit";

class ConcurrentPostUpdateError extends Error {}

export async function updatePost(
  slug: string,
  postId: string,
  _previous: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!club) return { error: "That club no longer exists." };
  const session = await requireClubEditor(
    club.id,
    slug,
    `/my-clubs/${slug}/posts/${postId}/edit`,
  );
  try {
    await assertRateLimit({
      action: "club-post-update",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 30,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: "Too many post updates. Try again later." };
    }
    throw error;
  }

  const post = await prisma.clubPost.findFirst({
    where: { id: postId, clubId: club.id },
    select: {
      id: true,
      title: true,
      moderationStatus: true,
      imageObjectKey: true,
      imageModerationFlagged: true,
      approvedTextHash: true,
      approvedImageObjectKey: true,
      updatedAt: true,
    },
  });
  if (!post) return { error: "That post no longer exists." };

  const parsed = parseEventFields(formData);
  if (!parsed.data) return { error: parsed.error };
  const validated = await validateImage(formData.get("image"));
  if (validated.error) return { error: validated.error };
  const removeImage = formData.get("removeImage") === "on";
  const textModeration = moderatePostText(
    parsed.data.title,
    parsed.data.subtitle,
    post.approvedTextHash,
  );
  const imageModeration = validated.image
    ? await moderatePostImage(validated.image)
    : removeImage || !post.imageObjectKey
      ? { flagged: false, reason: null }
      : post.approvedImageObjectKey === post.imageObjectKey
        ? { flagged: false, reason: null }
        : post.imageModerationFlagged
          ? {
              flagged: true,
              reason: "The image safety check needs administrator review.",
            }
          : await moderateStoredPostImage(post.imageObjectKey);
  const requiresReview = textModeration.flagged || imageModeration.flagged;

  let newImageObjectKey: string | null = null;
  try {
    if (validated.image) {
      newImageObjectKey = await uploadImage(
        `clubs/${club.id}/posts`,
        validated.image,
      );
    }
    const actor =
      session.user.name ?? session.user.email ?? session.user.username;
    const isNewlyPublished =
      !requiresReview && post.moderationStatus !== "PUBLISHED";
    await prisma.$transaction(async (tx) => {
      const updated = await tx.clubPost.updateMany({
        where: { id: post.id, updatedAt: post.updatedAt },
        data: {
          ...parsed.data,
          moderationStatus: requiresReview ? "PENDING_REVIEW" : "PUBLISHED",
          moderationReason: moderationReason([
            textModeration.reason,
            imageModeration.reason,
          ]),
          moderationNote: null,
          imageModerationFlagged: imageModeration.flagged,
          approvedTextHash: textModeration.flagged
            ? post.approvedTextHash
            : textModeration.hash,
          approvedImageObjectKey: imageModeration.flagged
            ? null
            : (newImageObjectKey ??
              (removeImage ? null : post.imageObjectKey)),
          moderationReviewedById: null,
          moderationReviewedBy: null,
          moderationReviewedAt: null,
          ...(newImageObjectKey
            ? { imageObjectKey: newImageObjectKey }
            : removeImage
              ? { imageObjectKey: null }
              : {}),
        },
      });
      if (updated.count === 0) throw new ConcurrentPostUpdateError();
      if ((newImageObjectKey || removeImage) && post.imageObjectKey) {
        await queueImageDeletion(tx, post.imageObjectKey);
      }
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          action: requiresReview
            ? "POST_SUBMITTED_FOR_REVIEW"
            : isNewlyPublished
              ? "POST_PUBLISHED"
              : "POST_UPDATED",
          actorId: session.user.id,
          actor,
          actorEmail: session.user.email,
          summary: requiresReview
            ? `Updated the post “${parsed.data.title}” and submitted it for moderation.`
            : isNewlyPublished
              ? `Updated and published the post “${parsed.data.title}”.`
              : post.title === parsed.data.title
                ? `Updated the published post “${parsed.data.title}”.`
                : `Renamed the published post from “${post.title}” to “${parsed.data.title}” and updated it.`,
        },
      });
    });
  } catch (error) {
    await discardDetachedImage(newImageObjectKey);
    if (error instanceof ConcurrentPostUpdateError) {
      return { error: "This post changed in another session. Please try again." };
    }
    throw error;
  }

  if ((newImageObjectKey || removeImage) && post.imageObjectKey) {
    await attemptQueuedImageDeletion(post.imageObjectKey);
  }

  revalidatePath("/feed");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  revalidatePath(`/clubs/${slug}`);
  revalidatePath(`/my-clubs/${slug}/posts`);
  redirect(
    requiresReview
      ? `/my-clubs/${slug}/posts?updated=pending`
      : `/my-clubs/${slug}/posts?updated=published`,
  );
}
