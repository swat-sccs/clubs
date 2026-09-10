"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { postTextHash } from "@/lib/post-moderation";
import { uniquifySlug } from "@/lib/slug";

function idFrom(formData: FormData) {
  const id = String(formData.get("requestId") ?? "");
  return id.length > 0 && id.length <= 64 ? id : null;
}

function reviewIdentity(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user.name ?? session.user.email;
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
    await prisma.$transaction(async (tx) => {
      const rejected = await tx.clubCreationRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedBy: reviewer,
          reviewedAt: new Date(),
          pendingKey: null,
        },
      });
      if (rejected.count === 0) return;
      const request = await tx.clubCreationRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      const requester =
        request.requesterName ??
        request.requesterEmail ??
        "an SCCS user";
      await tx.clubAuditLog.create({
        data: {
          clubName: request.name,
          action: "CREATION_REJECTED",
          actorId: session.user.id,
          actor: reviewer,
          actorEmail: session.user.email,
          summary: `Rejected the new-club request from ${requester}.`,
        },
      });
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
          role: "OWNER",
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
          action: "CREATION_APPROVED",
          actorId: session.user.id,
          actor: reviewer,
          actorEmail: session.user.email,
          summary: `Approved ${request.requesterName ?? request.requesterEmail ?? "an SCCS user"}'s request, published the club, and granted Owner access.`,
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
    await prisma.$transaction(async (tx) => {
      const rejected = await tx.clubClaimRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedBy: reviewer,
          reviewedAt: new Date(),
          pendingKey: null,
        },
      });
      if (rejected.count === 0) return;
      const request = await tx.clubClaimRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: { club: { select: { name: true } } },
      });
      const requester =
        request.requesterName ??
        request.requesterEmail ??
        "an SCCS user";
      await tx.clubAuditLog.create({
        data: {
          clubId: request.clubId,
          clubName: request.club.name,
          action: "CLAIM_REJECTED",
          actorId: session.user.id,
          actor: reviewer,
          actorEmail: session.user.email,
          summary: `Rejected ${requester}'s access claim.`,
        },
      });
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
        role: "EDITOR",
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
      "an SCCS user";
    await tx.clubAuditLog.create({
      data: {
        clubId: request.clubId,
        clubName: club.name,
        action: "CLAIM_APPROVED",
        actorId: session.user.id,
        actor: reviewer,
        actorEmail: session.user.email,
        summary: `Approved the access claim from ${editorName} and granted Editor access.`,
      },
    });
  });
  finishModeration();
}

export async function moderatePost(formData: FormData) {
  const session = await requireAdmin();
  const postId = idFrom(formData);
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").trim();
  if (
    !postId ||
    (decision !== "approve" && decision !== "deny") ||
    note.length > 1000
  ) {
    redirect("/admin/requests?error=Invalid%20post%20moderation%20request");
  }
  const reviewer = reviewIdentity(session);

  const clubSlug = await prisma.$transaction(async (tx) => {
    const claimed = await tx.clubPost.updateMany({
      where: { id: postId, moderationStatus: "PENDING_REVIEW" },
      data:
        decision === "approve"
          ? {
              moderationStatus: "PUBLISHED",
              moderationReason: null,
              moderationNote: null,
              imageModerationFlagged: false,
              moderationReviewedById: session.user.id,
              moderationReviewedBy: reviewer,
              moderationReviewedAt: new Date(),
            }
          : {
              moderationStatus: "DENIED",
              moderationNote: note || null,
              moderationReviewedById: session.user.id,
              moderationReviewedBy: reviewer,
              moderationReviewedAt: new Date(),
            },
    });
    if (claimed.count === 0) return null;

    const post = await tx.clubPost.findUniqueOrThrow({
      where: { id: postId },
      include: { club: { select: { id: true, slug: true, name: true } } },
    });
    if (decision === "approve") {
      await tx.clubPost.update({
        where: { id: post.id },
        data: {
          approvedTextHash: postTextHash(post.title, post.subtitle),
          approvedImageObjectKey: post.imageObjectKey,
        },
      });
    }
    await tx.clubAuditLog.create({
      data: {
        clubId: post.club.id,
        clubName: post.club.name,
        action: decision === "approve" ? "POST_APPROVED" : "POST_DENIED",
        actorId: session.user.id,
        actor: reviewer,
        actorEmail: session.user.email,
        summary:
          decision === "approve"
            ? `Approved the post “${post.title}” for publication.`
            : `Denied the post “${post.title}”${note ? ` with note: ${note}` : "."}`,
      },
    });
    return post.club.slug;
  });

  if (clubSlug) {
    revalidatePath("/feed");
    revalidatePath(`/clubs/${clubSlug}`);
    revalidatePath(`/my-clubs/${clubSlug}/posts`);
  }
  finishModeration();
}
