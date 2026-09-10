import { Prisma, type Club as ClubRow } from "@prisma/client";
import { prisma } from "./db";
import type { Club } from "./clubs";
import { TAGS, type Tag } from "./tags";

function toClub(row: ClubRow): Club {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    tags: row.tags.filter((tag): tag is Tag =>
      (TAGS as readonly string[]).includes(tag)
    ),
    size: row.size as Club["size"],
    isAcceptingMembers: row.isAcceptingMembers,
    membershipProcess: row.membershipProcess as Club["membershipProcess"],
    recruitingCycle: row.recruitingCycle as Club["recruitingCycle"],
    instagram: row.instagram,
    email: row.email,
    website: row.website,
    meetingInfo: row.meetingInfo,
    hasLogo: Boolean(row.logoObjectKey),
  };
}

export const UNCLAIMED_CLUB_GRACE_PERIOD_DAYS = 14;

type ClubVisibilityFields = Pick<
  ClubRow,
  "createdAt" | "visibilityOverride"
> & {
  editors: readonly unknown[];
};

export function isClubPublic(
  club: ClubVisibilityFields,
  now = new Date(),
): boolean {
  if (club.visibilityOverride !== null) return club.visibilityOverride;

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - UNCLAIMED_CLUB_GRACE_PERIOD_DAYS);
  return club.editors.length > 0 || club.createdAt >= cutoff;
}

export function publicClubVisibilityWhere(
  now = new Date(),
): Prisma.ClubWhereInput {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - UNCLAIMED_CLUB_GRACE_PERIOD_DAYS);
  return {
    OR: [
      { visibilityOverride: true },
      {
        visibilityOverride: null,
        OR: [
          { editors: { some: {} } },
          { createdAt: { gte: cutoff } },
        ],
      },
    ],
  };
}

/** All clubs in curated order (seed order, then newest submissions last). */
export async function getClubs(): Promise<Club[]> {
  const rows = await prisma.club.findMany({
    where: publicClubVisibilityWhere(),
    orderBy: { position: "asc" },
  });
  return rows.map(toClub);
}

export async function getClubBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<Club | null> {
  const row = options.includeHidden
    ? await prisma.club.findUnique({ where: { slug } })
    : await prisma.club.findFirst({
        where: { slug, ...publicClubVisibilityWhere() },
      });
  return row ? toClub(row) : null;
}
