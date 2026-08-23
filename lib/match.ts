import { prisma } from "./db";
import type { Club } from "./clubs";

export type ClubMatch = {
  club: Club;
  /** Cosine similarity in [-1, 1] between the query and the club profile. */
  score: number;
};

type MatcherResponse = {
  matches: { clubId: string; name: string; score: number }[];
};

/**
 * Rank clubs against a free-text interest description via the Go matcher
 * service (matcher/), which owns the embeddings. Throws if the matcher or the
 * embedding backend is down; callers show a friendly message.
 */
export async function matchClubs(
  query: string,
  limit = 8
): Promise<ClubMatch[]> {
  const matcherUrl = process.env.MATCHER_URL;
  if (!matcherUrl) throw new Error("MATCHER_URL is not configured");

  const response = await fetch(`${matcherUrl}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`matcher returned ${response.status}`);
  }
  const { matches } = (await response.json()) as MatcherResponse;
  if (matches.length === 0) return [];

  const rows = await prisma.club.findMany({
    where: { id: { in: matches.map((m) => m.clubId) } },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const result: ClubMatch[] = [];
  for (const m of matches) {
    const row = byId.get(m.clubId);
    if (!row) continue;
    result.push({
      club: {
        slug: row.slug,
        name: row.name,
        description: row.description,
        tags: row.tags,
        affiliation: row.affiliation,
        size: row.size,
        isAcceptingMembers: row.isAcceptingMembers,
        membershipProcess: row.membershipProcess,
        recruitingCycle: row.recruitingCycle,
        instagram: row.instagram,
        email: row.email,
        website: row.website,
        meetingInfo: row.meetingInfo,
      } as Club,
      score: m.score,
    });
  }
  return result;
}
