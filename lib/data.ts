import { Prisma, type Club as ClubRow } from "@prisma/client";
import { prisma } from "./db";
import {
  CLUB_SIZES,
  MEMBERSHIP_PROCESSES,
  RECRUITING_CYCLES,
  type Club,
} from "./clubs";
import { TAGS, type Tag } from "./tags";

function requiredClubValue<T extends string>(
  values: readonly T[],
  value: string,
  field: string,
): T {
  if (values.includes(value as T)) return value as T;
  throw new Error(`Club has an invalid ${field} value`);
}

export function toClub(row: ClubRow): Club {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    tags: row.tags.filter((tag): tag is Tag =>
      (TAGS as readonly string[]).includes(tag)
    ),
    size: requiredClubValue(CLUB_SIZES, row.size, "size"),
    isAcceptingMembers: row.isAcceptingMembers,
    membershipProcess: requiredClubValue(
      MEMBERSHIP_PROCESSES,
      row.membershipProcess,
      "membership process",
    ),
    recruitingCycle: requiredClubValue(
      RECRUITING_CYCLES,
      row.recruitingCycle,
      "recruiting cycle",
    ),
    instagram: row.instagram,
    email: row.email,
    website: row.website,
    meetingInfo: row.meetingInfo,
    hasLogo: Boolean(row.logoObjectKey),
  };
}

const configuredGracePeriod = Number(
  process.env.CLUB_VISIBILITY_GRACE_DAYS ?? "14",
);
export const UNCLAIMED_CLUB_GRACE_PERIOD_DAYS =
  Number.isInteger(configuredGracePeriod) &&
  configuredGracePeriod >= 1 &&
  configuredGracePeriod <= 90
    ? configuredGracePeriod
    : 14;

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
