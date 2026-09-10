"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClubEditor } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { parseEventFields } from "@/lib/events";
import {
  moderatePostImage,
  moderatePostText,
  moderationReason,
} from "@/lib/post-moderation";
import { uploadImage, validateImage } from "@/lib/storage";
import { discardDetachedImage } from "@/lib/storage-cleanup";
import {
  assertRateLimit,
  RateLimitError,
  requestRateLimitIdentifier,
} from "@/lib/rate-limit";

export type PostFormState = { error: string | null };

export async function createPost(
  slug: string,
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
    `/my-clubs/${slug}/posts/new`,
  );
  try {
    await assertRateLimit({
      action: "club-post-create",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 20,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: "Too many post submissions. Try again later." };
    }
    throw error;
  }

  const parsed = parseEventFields(formData);
  if (!parsed.data) return { error: parsed.error };

  const validated = await validateImage(formData.get("image"));
  if (validated.error) return { error: validated.error };
  const textModeration = moderatePostText(
    parsed.data.title,
    parsed.data.subtitle,
  );
  const imageModeration = validated.image
    ? await moderatePostImage(validated.image)
    : { flagged: false, reason: null };
  const requiresReview = textModeration.flagged || imageModeration.flagged;

  let imageObjectKey: string | null = null;
  try {
    if (validated.image) {
      imageObjectKey = await uploadImage(
        `clubs/${club.id}/posts`,
        validated.image,
      );
    }
    const author =
      session.user.name ?? session.user.email ?? session.user.username;
    await prisma.$transaction(async (tx) => {
      await tx.clubPost.create({
        data: {
          clubId: club.id,
          ...parsed.data,
          imageObjectKey,
          moderationStatus: requiresReview ? "PENDING_REVIEW" : "PUBLISHED",
          moderationReason: moderationReason([
            textModeration.reason,
            imageModeration.reason,
          ]),
          imageModerationFlagged: imageModeration.flagged,
          approvedTextHash: textModeration.flagged ? null : textModeration.hash,
          approvedImageObjectKey: imageModeration.flagged
            ? null
            : imageObjectKey,
          authorId: session.user.id,
          authorName: author,
        },
      });
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          action: requiresReview
            ? "POST_SUBMITTED_FOR_REVIEW"
            : "POST_PUBLISHED",
          actorId: session.user.id,
          actor: author,
          actorEmail: session.user.email,
          summary: requiresReview
            ? `Submitted the post “${parsed.data.title}” for moderation.`
            : `Published the post “${parsed.data.title}”.`,
        },
      });
    });
  } catch (error) {
    await discardDetachedImage(imageObjectKey);
    throw error;
  }

  revalidatePath("/feed");
  revalidatePath("/my-clubs");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  revalidatePath(`/clubs/${slug}`);
  redirect(
    requiresReview
      ? `/my-clubs/${slug}/posts?submitted=pending`
      : "/feed",
  );
}
