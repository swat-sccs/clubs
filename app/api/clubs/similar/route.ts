import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findSimilarClubNames, normalizeClubName } from "@/lib/club-name-similarity";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (normalizeClubName(query).replaceAll(" ", "").length < 3) {
    return Response.json(
      { clubs: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const clubs = await prisma.club.findMany({
    select: { slug: true, name: true, description: true },
  });
  const similarClubs = findSimilarClubNames(query, clubs, 4);

  return Response.json(
    { clubs: similarClubs },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
