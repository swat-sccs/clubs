// @ts-expect-error Bun provides this module at test runtime; the app does not
// ship Bun's ambient types to production.
import { describe, expect, test } from "bun:test";
import { isClubPublic, publicClubVisibilityWhere } from "./data";

const now = new Date("2026-09-10T12:00:00.000Z");

describe("club visibility", () => {
  test("an explicit admin override wins over automatic visibility", () => {
    const oldClaimedClub = {
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      editors: [{}],
    };

    expect(
      isClubPublic({ ...oldClaimedClub, visibilityOverride: false }, now),
    ).toBe(false);
    expect(
      isClubPublic({ ...oldClaimedClub, editors: [], visibilityOverride: true }, now),
    ).toBe(true);
  });

  test("falls back to the grace-period and assignment rule", () => {
    expect(
      isClubPublic(
        {
          createdAt: new Date("2026-09-01T12:00:00.000Z"),
          editors: [],
          visibilityOverride: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isClubPublic(
        {
          createdAt: new Date("2020-01-01T00:00:00.000Z"),
          editors: [],
          visibilityOverride: null,
        },
        now,
      ),
    ).toBe(false);
  });

  test("builds a query that applies the same override precedence", () => {
    expect(publicClubVisibilityWhere(now)).toEqual({
      OR: [
        { visibilityOverride: true },
        {
          visibilityOverride: null,
          OR: [
            { editors: { some: {} } },
            { createdAt: { gte: new Date("2026-08-27T12:00:00.000Z") } },
          ],
        },
      ],
    });
  });
});
