"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { uniquifySlug } from "@/lib/slug";

function idFrom(formData: FormData) {
  const id = String(formData.get("requestId") ?? "");
  return id.length > 0 && id.length <= 64 ? id : null;
}

function reviewIdentity(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user.name ?? session.user.email ?? session.user.username;
}

function finishModeration(publicClubChanged = false) {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/activity");
  if (publicClubChanged) {
    revalidatePath("/");
    revalidatePath("/clubs");
    revalidatePath("/match");
  }
  redirect("/admin/requests");
}

export async function moderateCreationRequest(formData: FormData) {
  const session = await requireAdmin();
  const requestId = idFrom(formData);
  const decision = formData.get("decision");
  if (!requestId || (decision !== "approve" && decision !== "reject")) {
    redirect("/admin/requests?error=Invalid%20moderation%20request");
  }
  const reviewer = reviewIdentity(session);

  if (decision === "reject") {
    await prisma.clubCreationRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        pendingKey: null,
      },
    });
    finishModeration();
  }

  try {
    const publishedSlug = await prisma.$transaction(async (tx) => {
      const claimed = await tx.clubCreationRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedBy: reviewer,
          reviewedAt: new Date(),
          pendingKey: null,
        },
      });
      if (claimed.count === 0) return null;

      const request = await tx.clubCreationRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      const duplicate = await tx.club.findFirst({
        where: { name: { equals: request.name, mode: "insensitive" } },
        select: { id: true },
      });
      if (duplicate) throw new Error("DUPLICATE_CLUB");

      const taken = new Set(
        (await tx.club.findMany({ select: { slug: true } })).map(
          ({ slug }) => slug,
        ),
      );
      const slug = uniquifySlug(request.name, taken);
      const club = await tx.club.create({
        data: {
          slug,
          name: request.name,
          description: request.description,
          tags: request.tags,
          size: request.size,
          isAcceptingMembers: request.isAcceptingMembers,
          membershipProcess: request.membershipProcess,
          recruitingCycle: request.recruitingCycle,
          instagram: request.instagram,
          email: request.email,
          website: request.website,
          meetingInfo: request.meetingInfo,
          createdById: request.requesterId,
          createdBy:
            request.requesterName ??
            request.requesterEmail ??
            request.requesterUsername,
          updatedById: request.requesterId,
          updatedBy:
            request.requesterName ??
            request.requesterEmail ??
            request.requesterUsername,
        },
      });
      await tx.clubEditor.create({
        data: {
          clubId: club.id,
          userId: request.requesterId,
          name: request.requesterName,
          email: request.requesterEmail,
          username: request.requesterUsername,
        },
      });
      await tx.clubCreationRequest.update({
        where: { id: requestId },
        data: { clubId: club.id },
      });
      await tx.clubAuditLog.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          action: "CREATED",
          actorId: request.requesterId,
          actor:
            request.requesterName ??
            request.requesterEmail ??
            request.requesterUsername,
          summary: "Published from an approved new-club request.",
        },
      });
      return slug;
    });
    if (publishedSlug) revalidatePath(`/clubs/${publishedSlug}`);
  } catch (error) {
    if (
      (error instanceof Error && error.message === "DUPLICATE_CLUB") ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002")
    ) {
      redirect("/admin/requests?error=A%20club%20with%20that%20name%20already%20exists");
    }
    throw error;
  }
  finishModeration(true);
}

export async function moderateClaimRequest(formData: FormData) {
  const session = await requireAdmin();
  const requestId = idFrom(formData);
  const decision = formData.get("decision");
  if (!requestId || (decision !== "approve" && decision !== "reject")) {
    redirect("/admin/requests?error=Invalid%20moderation%20request");
  }
  const reviewer = reviewIdentity(session);

  if (decision === "reject") {
    await prisma.clubClaimRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        pendingKey: null,
      },
    });
    finishModeration();
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.clubClaimRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: "APPROVED",
        reviewedById: session.user.id,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        pendingKey: null,
      },
    });
    if (claimed.count === 0) return;
    const request = await tx.clubClaimRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    await tx.clubEditor.upsert({
      where: {
        clubId_userId: {
          clubId: request.clubId,
          userId: request.requesterId,
        },
      },
      create: {
        clubId: request.clubId,
        userId: request.requesterId,
        name: request.requesterName,
        email: request.requesterEmail,
        username: request.requesterUsername,
      },
      update: {
        name: request.requesterName,
        email: request.requesterEmail,
        username: request.requesterUsername,
      },
    });
    const club = await tx.club.findUniqueOrThrow({
      where: { id: request.clubId },
      select: { name: true },
    });
    const editorName =
      request.requesterName ??
      request.requesterEmail ??
      request.requesterUsername ??
      "an SCCS user";
    await tx.clubAuditLog.create({
      data: {
        clubId: request.clubId,
        clubName: club.name,
        action: "EDITOR_GRANTED",
        actorId: session.user.id,
        actor: reviewer,
        summary: `Granted edit access to ${editorName}.`,
      },
    });
  });
  finishModeration();
}
