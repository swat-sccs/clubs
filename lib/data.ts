import type { Club as ClubRow } from "@prisma/client";
import { prisma } from "./db";
import type { Club } from "./clubs";

function toClub(row: ClubRow): Club {
  return {
    name: row.name,
    description: row.description,
    tags: row.tags,
    affiliation: row.affiliation,
    size: row.size,
    isAcceptingMembers: row.isAcceptingMembers,
    membershipProcess: row.membershipProcess,
    recruitingCycle: row.recruitingCycle,
  } as Club;
}

/** All clubs in curated order (seed order, then newest submissions last). */
export async function getClubs(): Promise<Club[]> {
  const rows = await prisma.club.findMany({ orderBy: { position: "asc" } });
  return rows.map(toClub);
}
