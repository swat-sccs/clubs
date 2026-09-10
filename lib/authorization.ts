import "server-only";

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

export async function requireClubEditor(clubId: string, slug: string) {
  const session = await requireUser(`/clubs/${slug}/edit`);
  if (!session.user.isAdmin) {
    const editor = await prisma.clubEditor.findUnique({
      where: { clubId_userId: { clubId, userId: session.user.id } },
      select: { id: true },
    });
    if (!editor) redirect(`/clubs/${slug}`);
  }
  return session;
}
