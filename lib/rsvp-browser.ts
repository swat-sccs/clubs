import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const RSVP_BROWSER_COOKIE = "swat_clubs_rsvp_browser";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function hashBrowserId(value: string) {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.SESSION_SECRET ??
    "swat-clubs-local-development";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function readRsvpBrowserHash() {
  const value = (await cookies()).get(RSVP_BROWSER_COOKIE)?.value;
  return value ? hashBrowserId(value) : null;
}

export async function getOrCreateRsvpBrowserHash() {
  const cookieStore = await cookies();
  let value = cookieStore.get(RSVP_BROWSER_COOKIE)?.value;
  if (!value) {
    value = randomUUID();
    cookieStore.set(RSVP_BROWSER_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
    });
  }
  return hashBrowserId(value);
}
