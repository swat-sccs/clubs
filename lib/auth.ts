import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

type KeycloakClaims = {
  groups?: unknown;
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  preferred_username?: unknown;
  ldap?: { groups?: unknown };
};

declare module "next-auth" {
  interface Session {
    user: {
      /** Keycloak subject id. */
      id: string;
      username: string;
      groups: string[];
      isAdmin: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    username?: string;
    groups?: string[];
  }
}

function decodeClaims(accessToken?: string): KeycloakClaims {
  if (!accessToken) return {};
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return {};
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function getGroups(accessToken?: string, profile?: unknown): string[] {
  const claims = {
    ...(typeof profile === "object" && profile ? profile : {}),
    ...decodeClaims(accessToken),
  } as KeycloakClaims;
  return Array.from(
    new Set([
      ...stringArray(claims.ldap?.groups),
      ...stringArray(claims.groups),
    ]),
  );
}

function getFullName(accessToken?: string, profile?: unknown): string | null {
  const claims = {
    ...(typeof profile === "object" && profile ? profile : {}),
    ...decodeClaims(accessToken),
  } as KeycloakClaims;
  if (typeof claims.name === "string" && claims.name.trim()) {
    return claims.name.trim();
  }
  const fullName = [claims.given_name, claims.family_name]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .map((part) => part.trim())
    .join(" ");
  return fullName || null;
}

function getUsername(accessToken?: string, profile?: unknown): string | null {
  const claims = {
    ...(typeof profile === "object" && profile ? profile : {}),
    ...decodeClaims(accessToken),
  } as KeycloakClaims;
  return typeof claims.preferred_username === "string" &&
    claims.preferred_username.trim()
    ? claims.preferred_username.trim()
    : null;
}

export function belongsToGroup(groups: string[], expectedGroup: string) {
  const normalizedExpected = expectedGroup.replace(/^\/+|\/+$/g, "");
  return groups.some((group) => {
    const normalizedGroup = group.replace(/^\/+|\/+$/g, "");
    return (
      normalizedGroup === normalizedExpected ||
      normalizedGroup.split("/").at(-1) === normalizedExpected
    );
  });
}

// SCCS Keycloak is the only way in; there is no local account system.
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  providers: [Keycloak],
  callbacks: {
    jwt({ token, account, profile }) {
      if (profile || account?.access_token) {
        token.groups = getGroups(account?.access_token, profile);
        token.name = getFullName(account?.access_token, profile) ?? token.name;
        token.username =
          getUsername(account?.access_token, profile) ?? token.username;
      }
      return token;
    },
    session({ session, token }) {
      const groups = stringArray(token.groups);
      session.user.id = token.sub ?? "";
      session.user.name =
        typeof token.name === "string" && token.name.trim()
          ? token.name
          : session.user.name;
      session.user.username =
        typeof token.username === "string" && token.username.trim()
          ? token.username
          : (session.user.name ?? "SCCS user");
      session.user.groups = groups;
      session.user.isAdmin = belongsToGroup(
        groups,
        process.env.KEYCLOAK_ADMIN_GROUP ?? "sccs-staff",
      );
      return session;
    },
  },
});
