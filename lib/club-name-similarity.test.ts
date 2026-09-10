// @ts-expect-error Bun provides this module at test runtime; the app does not
// ship Bun's ambient types to production.
import { describe, expect, test } from "bun:test";
import {
  clubNameSimilarity,
  findSimilarClubNames,
  normalizeClubName,
} from "./club-name-similarity";

describe("club name similarity", () => {
  test("normalizes punctuation and SCCS boilerplate", () => {
    expect(normalizeClubName("  Swarthmore Robotics & Engineering Club ")).toBe(
      "swarthmore robotics and engineering club",
    );
  });

  test("flags exact and reordered organization names", () => {
    expect(clubNameSimilarity("Debate Club", "Swarthmore Debate Club")).toBeGreaterThan(
      0.8,
    );
    expect(clubNameSimilarity("Robotics Engineering Club", "Engineering Robotics Society")).toBeGreaterThan(
      0.9,
    );
    expect(
      clubNameSimilarity("SASA", "Swarthmore African Student Association"),
    ).toBeGreaterThan(0.8);
  });

  test("does not flag unrelated clubs", () => {
    expect(clubNameSimilarity("Chess Club", "Outdoor Adventure Club")).toBeLessThan(
      0.56,
    );
    expect(
      findSimilarClubNames("Chess Club", [
        { name: "Outdoor Adventure Club", slug: "outdoors" },
      ]),
    ).toEqual([]);
  });

  test("allows partial names and misspellings", () => {
    const clubs = [
      { name: "Swarthmore Debate Society", slug: "debate" },
      { name: "Robotics Club", slug: "robotics" },
      { name: "Bird Club", slug: "birds" },
    ];
    expect(findSimilarClubNames("deb", clubs).map((club) => club.slug)).toContain(
      "debate",
    );
    expect(
      findSimilarClubNames("robotcs", clubs).map((club) => club.slug),
    ).toContain("robotics");
  });

  test("returns the closest existing clubs first", () => {
    const matches = findSimilarClubNames("Swarthmore Debate Society", [
      { name: "Bird Club", slug: "bird-club" },
      { name: "Debate Club", slug: "debate-club" },
      { name: "Swarthmore Debate Society", slug: "debate-society" },
    ]);
    expect(matches.map((match) => match.slug)).toEqual([
      "debate-society",
      "debate-club",
    ]);
  });
});
