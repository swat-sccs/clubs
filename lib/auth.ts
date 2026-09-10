import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "@auth/core/jwt";
import { prisma } from "@/lib/db";
import { userIdentityKey } from "@/lib/user-identity";

type KeycloakClaims = {
  groups?: unknown;
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  preferred_username?: unknown;
  email?: unknown;
  ldap?: { groups?: unknown };
};

declare module "next-auth" {
  interface Session {
    user: {
      /** Stable SCCS username key, with the Keycloak subject as fallback. */
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
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
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

function getEmail(accessToken?: string, profile?: unknown): string | null {
  const claims = {
    ...(typeof profile === "object" && profile ? profile : {}),
    ...decodeClaims(accessToken),
  } as KeycloakClaims;
  return typeof claims.email === "string" && claims.email.trim()
    ? claims.email.trim()
    : null;
}

function isDirectoryAdmin(groups: string[]) {
  return belongsToGroup(
    groups,
    process.env.KEYCLOAK_ADMIN_GROUP ?? "sccs-staff",
  );
}

export function hasAdminAccess(
  groups: string[],
  isAppAdmin: boolean,
  expectedGroup = process.env.KEYCLOAK_ADMIN_GROUP ?? "sccs-staff",
) {
  return isAppAdmin || belongsToGroup(groups, expectedGroup);
}

async function recordSignIn({
  id,
  username,
  name,
  email,
  directoryAdmin,
}: {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  directoryAdmin: boolean;
}) {
  const now = new Date();
  await prisma.appUser.upsert({
    where: { id },
    create: {
      id,
      username,
      name,
      email,
      isDirectoryAdmin: directoryAdmin,
      firstSignedInAt: now,
      lastSignedInAt: now,
    },
    update: {
      ...(username ? { username } : {}),
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      isDirectoryAdmin: directoryAdmin,
      lastSignedInAt: now,
    },
  });
}

export function belongsToGroup(groups: string[], expectedGroup: string) {
  const normalizedExpected = expectedGroup.replace(/^\/+|\/+$/g, "");
  return groups.some(
    (group) => group.replace(/^\/+|\/+$/g, "") === normalizedExpected,
  );
}

async function refreshKeycloakAccessToken(token: JWT): Promise<JWT> {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  const clientId = process.env.AUTH_KEYCLOAK_ID;
  const clientSecret = process.env.AUTH_KEYCLOAK_SECRET;
  if (!issuer || !clientId || !clientSecret || !token.refreshToken) {
    return { ...token, groups: [] as string[] };
  }

  try {
    const response = await fetch(
      `${issuer.replace(/\/$/, "")}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(`Keycloak returned ${response.status}`);
    const refreshed: unknown = await response.json();
    if (!refreshed || typeof refreshed !== "object") {
      throw new Error("Keycloak returned an invalid token response");
    }
    const value = refreshed as Record<string, unknown>;
    if (typeof value.access_token !== "string") {
      throw new Error("Keycloak did not return an access token");
    }
    const expiresIn =
      typeof value.expires_in === "number" ? value.expires_in : 300;
    return {
      ...token,
      accessToken: value.access_token,
      accessTokenExpires: Date.now() + expiresIn * 1000,
      refreshToken:
        typeof value.refresh_token === "string"
          ? value.refresh_token
          : token.refreshToken,
      groups: getGroups(value.access_token),
      name: getFullName(value.access_token) ?? token.name,
      username: getUsername(value.access_token) ?? token.username,
    };
  } catch (error) {
    console.error("Unable to refresh Keycloak authorization claims", error);
    // Fail closed for group-derived privileges while preserving the user's
    // ordinary authenticated session.
    return { ...token, groups: [] as string[] };
  }
}

// SCCS Keycloak is the only way in; there is no local account system.
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 4 * 60 * 60 },
  providers: [Keycloak],
  callbacks: {
    async signIn({ user, account, profile }) {
      const username = getUsername(account?.access_token, profile);
      const id = userIdentityKey(
        username,
        profile?.sub ?? account?.providerAccountId,
      );
      if (!id) return true;

      const groups = getGroups(account?.access_token, profile);
      try {
        await recordSignIn({
          id,
          username,
          name:
            getFullName(account?.access_token, profile) ??
            (typeof user.name === "string" ? user.name : null),
          email:
            getEmail(account?.access_token, profile) ??
            (typeof user.email === "string" ? user.email : null),
          directoryAdmin: isDirectoryAdmin(groups),
        });
      } catch (error) {
        // User-directory bookkeeping must not make Keycloak unavailable as an
        // authentication provider. Manual grants fail closed until DB access
        // is restored, while directory administrators retain group access.
        console.error("Unable to record SCCS user sign-in", error);
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (profile || account?.access_token) {
        token.groups = getGroups(account?.access_token, profile);
        token.name = getFullName(account?.access_token, profile) ?? token.name;
        token.username =
          getUsername(account?.access_token, profile) ?? token.username;
        token.accessToken = account?.access_token;
        token.accessTokenExpires = account?.expires_at
          ? account.expires_at * 1000
          : Date.now() + 5 * 60 * 1000;
        token.refreshToken = account?.refresh_token;
        return token;
      }
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 30_000
      ) {
        return token;
      }
      return refreshKeycloakAccessToken(token);
    },
    async session({ session, token }) {
      const groups = stringArray(token.groups);
      session.user.id = userIdentityKey(token.username, token.sub);
      session.user.name =
        typeof token.name === "string" && token.name.trim()
          ? token.name
          : session.user.name;
      session.user.username =
        typeof token.username === "string" && token.username.trim()
          ? token.username
          : (session.user.name ?? "SCCS user");
      session.user.groups = groups;
      const directoryAdmin = isDirectoryAdmin(groups);
      session.user.isAdmin = directoryAdmin;
      if (session.user.id) {
        try {
          let appUser = await prisma.appUser.findUnique({
            where: { id: session.user.id },
            select: { isAppAdmin: true, isDirectoryAdmin: true },
          });
          if (!appUser) {
            await recordSignIn({
              id: session.user.id,
              username:
                typeof token.username === "string" ? token.username : null,
              name: session.user.name ?? null,
              email: session.user.email ?? null,
              directoryAdmin,
            });
            appUser = { isAppAdmin: false, isDirectoryAdmin: directoryAdmin };
          } else if (appUser.isDirectoryAdmin !== directoryAdmin) {
            await prisma.appUser.updateMany({
              where: { id: session.user.id },
              data: { isDirectoryAdmin: directoryAdmin },
            });
          }
          session.user.isAdmin = hasAdminAccess(
            groups,
            Boolean(appUser?.isAppAdmin),
          );
        } catch (error) {
          console.error("Unable to read application-admin access", error);
        }
      }
      return session;
    },
  },
});
