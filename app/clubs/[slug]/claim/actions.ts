"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export type ClaimRequestState = { error: string | null };

export async function claimClubAsAdmin(slug: string, formData: FormData) {
  void formData;

  const session = await requireAdmin(`/clubs/${slug}/claim`);
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      editors: {
        where: { userId: session.user.id },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!club) redirect("/clubs");
  if (club.editors.length > 0) redirect(`/clubs/${slug}/edit`);

  const owner = session.user.name ?? session.user.email ?? session.user.username;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.clubEditor.create({
        data: {
          clubId: club.id,
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          username: session.user.username,
          role: "OWNER",
        },
      });
      await tx.clubClaimRequest.updateMany({
        where: {
          clubId: club.id,
          requesterId: session.user.id,
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
          pendingKey: null,
          reviewedById: session.user.id,
          reviewedBy: owner,
          reviewedAt: new Date(),
        },
      });
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          action: "OWNER_GRANTED",
          actorId: session.user.id,
          actor: owner,
          actorEmail: session.user.email,
          summary: "Claimed ownership as an administrator.",
        },
      });
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  revalidatePath("/my-clubs");
  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/activity");
  redirect(`/clubs/${slug}`);
}

export async function submitClaimRequest(
  slug: string,
  _previous: ClaimRequestState,
  formData: FormData,
): Promise<ClaimRequestState> {
  const session = await requireUser(`/clubs/${slug}/claim`);
  const role = String(formData.get("role") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  if (role.length < 2 || role.length > 120) {
    return { error: "Your club role must be between 2 and 120 characters." };
  }
  if (explanation.length < 10 || explanation.length > 2000) {
    return { error: "Please provide an explanation between 10 and 2000 characters." };
  }

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      editors: {
        where: { userId: session.user.id },
        select: { id: true },
        take: 1,
      },
      claimRequests: {
        where: { requesterId: session.user.id, status: "PENDING" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!club) return { error: "That club no longer exists." };
  if (session.user.isAdmin || club.editors.length > 0) {
    return { error: "You already have permission to edit this club." };
  }
  if (club.claimRequests.length > 0) {
    return { error: "Your claim is already awaiting review." };
  }

  try {
    await prisma.clubClaimRequest.create({
      data: {
        clubId: club.id,
        requesterId: session.user.id,
        requesterName: session.user.name,
        requesterEmail: session.user.email,
        requesterUsername: session.user.username,
        pendingKey: `${club.id}:${session.user.id}`,
        role,
        explanation,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Your claim is already awaiting review." };
    }
    throw error;
  }
  redirect(`/clubs/${slug}/claim?submitted=1`);
}
