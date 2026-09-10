"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export type AdminAccessState = {
  error: string | null;
  message: string | null;
};

function targetLabel(user: {
  username: string | null;
  name: string | null;
  email: string | null;
}) {
  return user.name ?? user.username ?? user.email ?? "SCCS user";
}

export async function updateAppAdminAccess(
  _previous: AdminAccessState,
  formData: FormData,
): Promise<AdminAccessState> {
  const session = await requireAdmin("/admin/users");
  const userId = String(formData.get("userId") ?? "");
  const requestedAccess = String(formData.get("isAppAdmin") ?? "");
  if (
    !userId ||
    userId.length > 128 ||
    (requestedAccess !== "true" && requestedAccess !== "false")
  ) {
    return { error: "Invalid administrator access update.", message: null };
  }
  if (userId === session.user.id) {
    return {
      error: "You cannot change your own administrator access.",
      message: null,
    };
  }

  const isAppAdmin = requestedAccess === "true";
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.appUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isAppAdmin: true,
        isDirectoryAdmin: true,
      },
    });
    if (!user) return null;
    if (user.isAppAdmin === isAppAdmin) {
      return { user, changed: false };
    }

    await tx.appUser.update({
      where: { id: user.id },
      data: { isAppAdmin },
    });
    const label = targetLabel(user);
    await tx.clubAuditLog.create({
      data: {
        clubName: "Application administration",
        action: isAppAdmin ? "ADMIN_ACCESS_GRANTED" : "ADMIN_ACCESS_REVOKED",
        actorId: session.user.id,
        actor: session.user.name ?? session.user.email,
        actorEmail: session.user.email,
        summary: isAppAdmin
          ? `Granted application administrator access to ${label}.`
          : `Revoked application administrator access from ${label}.`,
      },
    });
    return { user, changed: true };
  });

  if (!result) {
    return { error: "That user no longer exists.", message: null };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/activity");
  const label = targetLabel(result.user);
  if (!result.changed) {
    return {
      error: null,
      message: isAppAdmin
        ? `${label} already has an application-admin grant.`
        : `${label} does not have an application-admin grant.`,
    };
  }
  return {
    error: null,
    message: isAppAdmin
      ? `${label} can now access administration.`
      : result.user.isDirectoryAdmin
        ? `${label}'s app grant was removed; their SCCS group still provides administrator access.`
        : `${label}'s administrator access was removed.`,
  };
}
