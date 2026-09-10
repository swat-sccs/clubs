// @ts-expect-error Bun provides this module at test runtime; the app does not
// ship Bun's ambient types to production.
import { describe, expect, test } from "bun:test";
import { belongsToGroup, getGroups, hasAdminAccess } from "./auth";

describe("Keycloak authorization claims", () => {
  test("matches only the exact configured group path", () => {
    expect(belongsToGroup(["/sccs-staff"], "sccs-staff")).toBe(true);
    expect(belongsToGroup(["/staff/sccs-staff"], "sccs-staff")).toBe(false);
    expect(
      belongsToGroup(["/staff/sccs-staff"], "/staff/sccs-staff"),
    ).toBe(true);
  });

  test("deduplicates group claims from Keycloak profiles", () => {
    expect(
      getGroups(undefined, {
        groups: ["/sccs-staff", "/clubs"],
        ldap: { groups: ["/clubs", 42] },
      }),
    ).toEqual(["/clubs", "/sccs-staff"]);
  });

  test("combines directory membership with app-admin grants", () => {
    expect(hasAdminAccess(["/sccs-staff"], false, "sccs-staff")).toBe(true);
    expect(hasAdminAccess(["/clubs"], true, "sccs-staff")).toBe(true);
    expect(hasAdminAccess(["/clubs"], false, "sccs-staff")).toBe(false);
  });
});
