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
  const post = await prisma.clubPost.findUnique({
    where: { id },
    select: {
      imageObjectKey: true,
      moderationStatus: true,
      clubId: true,
      club: {
        select: {
          createdAt: true,
          visibilityOverride: true,
          editors: { select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!post?.imageObjectKey) return new Response(null, { status: 404 });
  const isPrivate =
    post.moderationStatus !== "PUBLISHED" || !isClubPublic(post.club);
  if (isPrivate && !(await canEditClub(post.clubId))) {
    return new Response(null, { status: 404 });
  }
  return mediaResponse(post.imageObjectKey, { private: isPrivate });
}
