import { prisma } from "./db";
import type { Club } from "./clubs";
import { publicClubVisibilityWhere, toClub } from "./data";
import { assertRateLimit, requestRateLimitIdentifier } from "./rate-limit";

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
  await assertRateLimit({
    action: "club-match",
    identifier: await requestRateLimitIdentifier(),
    limit: 10,
    windowMs: 60_000,
  });

  const response = await fetch(`${matcherUrl}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
    cache: "no-store",
    signal: AbortSignal.timeout(40_000),
  });
  if (!response.ok) {
    throw new Error(`matcher returned ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (!isMatcherResponse(payload)) {
    throw new Error("matcher returned an invalid response");
  }
  const { matches } = payload;
  if (matches.length === 0) return [];

  const rows = await prisma.club.findMany({
    where: {
      id: { in: matches.map((m) => m.clubId) },
      ...publicClubVisibilityWhere(),
    },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const result: ClubMatch[] = [];
  for (const m of matches) {
    const row = byId.get(m.clubId);
    if (!row) continue;
    result.push({
      club: toClub(row),
      score: m.score,
    });
  }
  return result;
}

function isMatcherResponse(value: unknown): value is MatcherResponse {
  if (!value || typeof value !== "object") return false;
  const matches = (value as { matches?: unknown }).matches;
  return (
    Array.isArray(matches) &&
    matches.length <= 25 &&
    matches.every(
      (match) =>
        Boolean(match) &&
        typeof match === "object" &&
        typeof (match as { clubId?: unknown }).clubId === "string" &&
        (match as { clubId: string }).clubId.length <= 128 &&
        typeof (match as { name?: unknown }).name === "string" &&
        Number.isFinite((match as { score?: unknown }).score),
    )
  );
}
