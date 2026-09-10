import "server-only";

import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireUser(nextPath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export async function requireAdmin(nextPath = "/admin/requests") {
  const session = await requireUser(nextPath);
  if (!session.user.isAdmin) redirect("/");
  return session;
}

export async function canEditClub(
  clubId: string,
  session: Session | null = null,
) {
  session ??= await auth();
  if (!session?.user?.id) return false;
  if (session.user.isAdmin) return true;
  const editor = await prisma.clubEditor.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
    select: { id: true },
  });
  return Boolean(editor);
}

export async function requireClubEditor(
  clubId: string,
  slug: string,
  nextPath = `/clubs/${slug}/edit`,
) {
  const session = await requireUser(nextPath);
  if (!(await canEditClub(clubId, session))) redirect(`/clubs/${slug}`);
  return session;
}
