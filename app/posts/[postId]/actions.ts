"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function takeDownPost(formData: FormData) {
  const session = await requireAdmin("/feed");
  const postId = String(formData.get("postId") ?? "");
  if (!postId || postId.length > 64) redirect("/feed");

  const result = await prisma.$transaction(async (tx) => {
    const removed = await tx.clubPost.updateMany({
      where: { id: postId, moderationStatus: "PUBLISHED" },
      data: {
        moderationStatus: "DENIED",
        moderationReason: "Removed by an administrator.",
        moderationNote: "Removed after publication.",
        moderationReviewedById: session.user.id,
        moderationReviewedBy:
          session.user.name ?? session.user.email ?? session.user.username,
        moderationReviewedAt: new Date(),
      },
    });
    if (removed.count === 0) return null;

    const post = await tx.clubPost.findUniqueOrThrow({
      where: { id: postId },
      include: { club: { select: { id: true, slug: true, name: true } } },
    });
    await tx.clubAuditLog.create({
      data: {
        clubId: post.club.id,
        clubName: post.club.name,
        action: "POST_TAKEN_DOWN",
        actorId: session.user.id,
        actor:
          session.user.name ?? session.user.email ?? session.user.username,
        actorEmail: session.user.email,
        summary: `Removed the published post “${post.title}”.`,
      },
    });
    return post.club.slug;
  });

  if (result) {
    revalidatePath("/feed");
    revalidatePath(`/clubs/${result}`);
    revalidatePath(`/my-clubs/${result}/posts`);
    revalidatePath("/admin/activity");
  }
  redirect("/feed");
}
