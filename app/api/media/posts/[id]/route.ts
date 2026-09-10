import { prisma } from "@/lib/db";
import { mediaResponse } from "@/lib/media-response";
import { auth } from "@/lib/auth";

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
    },
  });
  if (!post?.imageObjectKey) return new Response(null, { status: 404 });
  const isPrivate = post.moderationStatus !== "PUBLISHED";
  if (isPrivate) {
    const session = await auth();
    if (!session?.user?.id) return new Response(null, { status: 404 });
    if (!session.user.isAdmin) {
      const editor = await prisma.clubEditor.findUnique({
        where: {
          clubId_userId: {
            clubId: post.clubId,
            userId: session.user.id,
          },
        },
        select: { id: true },
      });
      if (!editor) return new Response(null, { status: 404 });
    }
  }
  return mediaResponse(post.imageObjectKey, { private: isPrivate });
}
