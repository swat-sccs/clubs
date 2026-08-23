import type { Club as ClubRow } from "@prisma/client";
import { prisma } from "./db";
import type { Club } from "./clubs";
import { TAGS, type Tag } from "./tags";

function toClub(row: ClubRow): Club {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    tags: row.tags.filter((tag): tag is Tag =>
      (TAGS as readonly string[]).includes(tag)
    ),
    affiliation: row.affiliation as Club["affiliation"],
    size: row.size as Club["size"],
    isAcceptingMembers: row.isAcceptingMembers,
    membershipProcess: row.membershipProcess as Club["membershipProcess"],
    recruitingCycle: row.recruitingCycle as Club["recruitingCycle"],
    instagram: row.instagram,
    email: row.email,
    website: row.website,
    meetingInfo: row.meetingInfo,
  };
}

/** All clubs in curated order (seed order, then newest submissions last). */
export async function getClubs(): Promise<Club[]> {
  const rows = await prisma.club.findMany({ orderBy: { position: "asc" } });
  return rows.map(toClub);
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const row = await prisma.club.findUnique({ where: { slug } });
  return row ? toClub(row) : null;
}
