"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth, signIn } from "@/lib/auth";
import { requireUser } from "@/lib/authorization";
import { parseClubFormData } from "@/lib/club-form";
import {
  findSimilarClubNames,
  normalizeClubName,
} from "@/lib/club-name-similarity";
import { prisma } from "@/lib/db";
import {
  assertRateLimit,
  RateLimitError,
  requestRateLimitIdentifier,
} from "@/lib/rate-limit";

export type SimilarClub = { slug: string; name: string; description: string };
export type ClubFormState = {
  error: string | null;
  similarClubs?: SimilarClub[];
  checkedName?: string | null;
  exactMatch?: boolean;
};

export async function startAddClub() {
  const session = await auth();
  if (session?.user) redirect("/clubs/new");
  await signIn("keycloak", { redirectTo: "/clubs/new" });
}

export async function createClubRequest(
  previous: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const session = await requireUser("/clubs/new");
  const parsed = parseClubFormData(formData);
  if (!parsed.data) return { error: parsed.error };

  try {
    await assertRateLimit({
      action: "club-create-request",
      identifier: await requestRateLimitIdentifier(session.user.id),
      limit: 10,
      windowMs: 24 * 60 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: "You have submitted too many requests today." };
    }
    throw error;
  }

  const normalizedName = normalizeClubName(parsed.data.name);
  const [clubs, pendingRequest] = await Promise.all([
    prisma.club.findMany({
      select: { slug: true, name: true, description: true },
    }),
    prisma.clubCreationRequest.findFirst({
      where: {
        status: "PENDING",
        name: { equals: parsed.data.name, mode: "insensitive" },
      },
      select: { id: true },
    }),
  ]);
  if (pendingRequest) {
    return { error: "A request for that club is already awaiting review." };
  }

  const confirmedDistinct =
    formData.get("confirmDistinct") === "true" &&
    previous.checkedName === normalizedName;
  if (!confirmedDistinct) {
    const similarClubs = findSimilarClubNames(parsed.data.name, clubs);
    if (similarClubs.length > 0) {
      return {
        error: null,
        similarClubs,
        checkedName: normalizedName,
        exactMatch: similarClubs.some(
          (club) => normalizeClubName(club.name) === normalizedName,
        ),
      };
    }
  }

  if (
    confirmedDistinct &&
    clubs.some((club) => normalizeClubName(club.name) === normalizedName)
  ) {
    return {
      error: "That exact club already exists. Claim its page instead.",
      similarClubs: findSimilarClubNames(parsed.data.name, clubs),
      checkedName: normalizedName,
      exactMatch: true,
    };
  }

  try {
    await prisma.clubCreationRequest.create({
      data: {
        ...parsed.data,
        requesterId: session.user.id,
        requesterName: session.user.name,
        requesterEmail: session.user.email,
        requesterUsername: session.user.username,
        pendingKey: normalizedName,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A request for that club is already awaiting review." };
    }
    throw error;
  }
  redirect("/clubs/new/submitted");
}
