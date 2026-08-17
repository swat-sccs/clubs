import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

declare module "next-auth" {
  interface Session {
    user: {
      /** Keycloak subject id. */
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// SCCS Keycloak is the only way in; there is no local account system.
// Reads AUTH_KEYCLOAK_ID / AUTH_KEYCLOAK_SECRET / AUTH_KEYCLOAK_ISSUER and
// AUTH_SECRET from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      return session;
    },
  },
});
