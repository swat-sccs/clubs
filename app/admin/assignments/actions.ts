"use server";

import { ClubAccessRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export type AccessActionState = {
  error: string | null;
  message: string | null;
};

function value(formData: FormData, key: string) {
  const result = String(formData.get(key) ?? "");
  return result.length > 0 && result.length <= 64 ? result : null;
}

function actorLabel(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user.name ?? session.user.email;
}

function userLabel(editor: {
  name: string | null;
  email: string | null;
}) {
  return editor.name ?? editor.email ?? "Unknown SCCS user";
}

function refreshAccessPages(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/activity");
  revalidatePath("/my-clubs");
  revalidatePath(`/clubs/${slug}`);
}

function refreshVisibilityPages(slug: string) {
  refreshAccessPages(slug);
  revalidatePath("/");
  revalidatePath("/clubs");
  revalidatePath("/match");
}

export async function updateClubVisibility(
  _previous: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const session = await requireAdmin("/admin/assignments");
  const clubId = value(formData, "clubId");
  const requestedVisibility = String(formData.get("visibility") ?? "");
  if (
    !clubId ||
    (requestedVisibility !== "public" && requestedVisibility !== "hidden")
  ) {
    return { error: "Invalid visibility update.", message: null };
  }

  const makePublic = requestedVisibility === "public";
  const result = await prisma.$transaction(async (tx) => {
    const club = await tx.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        slug: true,
        visibilityOverride: true,
      },
    });
    if (!club) return null;

    if (club.visibilityOverride === makePublic) {
      return { slug: club.slug, name: club.name, changed: false };
    }

    await tx.club.update({
      where: { id: club.id },
      data: { visibilityOverride: makePublic },
    });
    await tx.clubAuditLog.create({
      data: {
        clubId: club.id,
        clubName: club.name,
        action: makePublic ? "CLUB_PUBLISHED" : "CLUB_HIDDEN",
        actorId: session.user.id,
        actor: actorLabel(session),
        actorEmail: session.user.email,
        summary: makePublic
          ? "Published the club in the public directory."
          : "Hidden the club from the public directory.",
      },
    });
    return { slug: club.slug, name: club.name, changed: true };
  });

  if (!result) return { error: "That club no longer exists.", message: null };
  refreshVisibilityPages(result.slug);
  return {
    error: null,
    message: result.changed
      ? `${result.name} is now ${makePublic ? "public" : "hidden"}.`
      : `${result.name} is already ${makePublic ? "public" : "hidden"}.`,
  };
}

export async function updateClubAccess(
  _previous: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const session = await requireAdmin("/admin/assignments");
  const assignmentId = value(formData, "assignmentId");
  const requestedRole = String(formData.get("role") ?? "");
  if (
    !assignmentId ||
    (requestedRole !== ClubAccessRole.OWNER &&
      requestedRole !== ClubAccessRole.EDITOR)
  ) {
    return { error: "Invalid access update.", message: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.clubEditor.findUnique({
      where: { id: assignmentId },
      include: { club: { select: { id: true, name: true, slug: true } } },
    });
    if (!assignment) return null;
    const role = requestedRole as ClubAccessRole;
    if (assignment.role === role) {
      return { slug: assignment.club.slug, changed: false, label: userLabel(assignment) };
    }

    await tx.clubEditor.update({
      where: { id: assignment.id },
      data: { role },
    });
    const label = userLabel(assignment);
    const promoted = role === ClubAccessRole.OWNER;
    await tx.clubAuditLog.create({
      data: {
        clubId: assignment.club.id,
        clubName: assignment.club.name,
        action: promoted ? "ACCESS_PROMOTED" : "ACCESS_DEMOTED",
        actorId: session.user.id,
        actor: actorLabel(session),
        actorEmail: session.user.email,
        summary: promoted
          ? `Promoted ${label} from Editor to Owner.`
          : `Changed ${label} from Owner to Editor.`,
      },
    });
    return { slug: assignment.club.slug, changed: true, label };
  });

  if (!result) return { error: "That assignment no longer exists.", message: null };
  refreshAccessPages(result.slug);
  return {
    error: null,
    message: result.changed
      ? `${result.label}'s role was updated.`
      : `${result.label} already has that role.`,
  };
}

export async function revokeClubAccess(
  _previous: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const session = await requireAdmin("/admin/assignments");
  const assignmentId = value(formData, "assignmentId");
  if (!assignmentId) {
    return { error: "Invalid access revocation.", message: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.clubEditor.findUnique({
      where: { id: assignmentId },
      include: { club: { select: { id: true, name: true, slug: true } } },
    });
    if (!assignment) return null;

    await tx.clubEditor.delete({ where: { id: assignment.id } });
    const label = userLabel(assignment);
    await tx.clubAuditLog.create({
      data: {
        clubId: assignment.club.id,
        clubName: assignment.club.name,
        action: "ACCESS_REVOKED",
        actorId: session.user.id,
        actor: actorLabel(session),
        actorEmail: session.user.email,
        summary: `Revoked ${assignment.role.toLowerCase()} access from ${label}.`,
      },
    });
    return { slug: assignment.club.slug, label };
  });

  if (!result) return { error: "That assignment no longer exists.", message: null };
  refreshAccessPages(result.slug);
  return { error: null, message: `${result.label}'s access was revoked.` };
}
