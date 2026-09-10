"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClubFormState } from "@/app/clubs/new/actions";
import { requireClubEditor } from "@/lib/authorization";
import { parseClubFormData } from "@/lib/club-form";
import { prisma } from "@/lib/db";
import { moderatePostImage, moderatePostText } from "@/lib/post-moderation";
import {
  assertRateLimit,
  RateLimitError,
  requestRateLimitIdentifier,
} from "@/lib/rate-limit";
import { uploadImage, validateImage } from "@/lib/storage";
import {
  attemptQueuedImageDeletion,
  discardDetachedImage,
  queueImageDeletion,
} from "@/lib/storage-cleanup";

export type ClubLogoState = {
  error: string | null;
  uploaded: boolean;
};

class ConcurrentClubUpdateError extends Error {}

export async function updateClubLogo(
  slug: string,
  _previous: ClubLogoState,
  formData: FormData,
): Promise<ClubLogoState> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true, logoObjectKey: true },
  });
  if (!club) return { error: "That club no longer exists.", uploaded: false };
  const session = await requireClubEditor(club.id, slug);
  try {
    await assertRateLimit({
      action: "club-logo-upload",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 10,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: "Too many logo uploads. Try again later.", uploaded: false };
    }
    throw error;
  }
  const validated = await validateImage(formData.get("logo"));
  if (validated.error) return { error: validated.error, uploaded: false };
  if (!validated.image) {
    return { error: "Choose an image to upload.", uploaded: false };
  }
  const moderation = await moderatePostImage(validated.image);
  if (moderation.flagged && !session.user.isAdmin) {
    return {
      error:
        "This logo needs administrator review before it can be published.",
      uploaded: false,
    };
  }

  const actor = session.user.name ?? session.user.email ?? session.user.username;
  let newLogoObjectKey: string | null = null;
  try {
    newLogoObjectKey = await uploadImage(
      `clubs/${club.id}/logo`,
      validated.image,
    );
    await prisma.$transaction(async (tx) => {
      const updated = await tx.club.updateMany({
        where: { id: club.id, logoObjectKey: club.logoObjectKey },
        data: {
          logoObjectKey: newLogoObjectKey,
          updatedById: session.user.id,
          updatedBy: actor,
        },
      });
      if (updated.count === 0) throw new ConcurrentClubUpdateError();
      await queueImageDeletion(tx, club.logoObjectKey);
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          action: "LOGO_UPDATED",
          actorId: session.user.id,
          actor,
          actorEmail: session.user.email,
          summary: "Updated the club logo.",
        },
      });
    });
  } catch (error) {
    await discardDetachedImage(newLogoObjectKey);
    if (error instanceof ConcurrentClubUpdateError) {
      return {
        error: "The logo changed in another session. Please try again.",
        uploaded: false,
      };
    }
    throw error;
  }

  await attemptQueuedImageDeletion(club.logoObjectKey);
  revalidatePath("/");
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${slug}`);
  revalidatePath(`/clubs/${slug}/edit`);
  revalidatePath("/feed");
  revalidatePath("/match");
  revalidatePath("/my-clubs");
  revalidatePath("/posts/[postId]", "page");
  return { error: null, uploaded: true };
}

export async function updateClub(
  slug: string,
  _previous: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!club) return { error: "That club no longer exists." };
  const session = await requireClubEditor(club.id, slug);
  try {
    await assertRateLimit({
      action: "club-profile-update",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 30,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: "Too many profile updates. Try again later." };
    }
    throw error;
  }
  const parsed = parseClubFormData(formData);
  if (!parsed.data) return { error: parsed.error };
  const profileModeration = moderatePostText(
    parsed.data.name,
    [
      parsed.data.description,
      parsed.data.meetingInfo,
      parsed.data.instagram,
      parsed.data.email,
      parsed.data.website,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  if (profileModeration.flagged && !session.user.isAdmin) {
    return {
      error:
        "This profile contains language that needs administrator review before publication.",
    };
  }

  const duplicate = await prisma.club.findFirst({
    where: {
      id: { not: club.id },
      name: { equals: parsed.data.name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (duplicate) return { error: "A club with that name already exists." };

  const editor = session.user.name ?? session.user.email ?? session.user.username;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.club.update({
        where: { id: club.id },
        data: {
          ...parsed.data,
          updatedById: session.user.id,
          updatedBy: editor,
        },
      });
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: parsed.data.name,
          action: "UPDATED",
          actorId: session.user.id,
          actor: editor,
          actorEmail: session.user.email,
          summary:
            club.name === parsed.data.name
              ? "Updated club profile details."
              : `Renamed from ${club.name} to ${parsed.data.name} and updated the profile.`,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A club with that name already exists." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/match");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  redirect(`/clubs/${slug}`);
}
