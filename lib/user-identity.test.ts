// @ts-expect-error Bun provides this module at test runtime; the app does not
// ship Bun's ambient types to production.
import { describe, expect, test } from "bun:test";
import { normalizeUsername, userIdentityKey } from "./user-identity";

describe("user identity", () => {
  test("normalizes SCCS usernames into stable namespaced keys", () => {
    expect(normalizeUsername("  DCRepublic ")).toBe("dcrepublic");
    expect(userIdentityKey("  DCRepublic ", "changing-subject-id")).toBe(
      "username:dcrepublic",
    );
  });

  test("falls back to the provider subject when no username is available", () => {
    expect(userIdentityKey(undefined, " keycloak-subject ")).toBe(
      "keycloak-subject",
    );
  });

  test("returns an empty key when neither identity claim is usable", () => {
    expect(userIdentityKey("   ", undefined)).toBe("");
  });
});
