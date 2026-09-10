"use server";

import { signOut } from "@/lib/auth";

export async function signOutFromMenu() {
  await signOut({ redirectTo: "/" });
}
