import { prisma } from "@/lib/db";
import { mediaResponse } from "@/lib/media-response";
import { canEditClub } from "@/lib/authorization";
import { isClubPublic } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      logoObjectKey: true,
      createdAt: true,
      visibilityOverride: true,
      editors: { select: { id: true }, take: 1 },
    },
  });
  if (!club?.logoObjectKey) return new Response(null, { status: 404 });
  if (!isClubPublic(club) && !(await canEditClub(club.id))) {
    return new Response(null, { status: 404 });
  }
  // The route URL is stable when an editor replaces a logo, so browsers must
  // revalidate it instead of holding the old object indefinitely.
  return mediaResponse(club.logoObjectKey, { private: true });
}
