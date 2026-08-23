"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { isLikelyEmail } from "@/lib/contact";
import { prisma } from "@/lib/db";
import {
  CLUB_SIZES,
  MEMBERSHIP_PROCESSES,
  RECRUITING_CYCLES,
  SWARTHMORE_AFFILIATIONS,
} from "@/lib/clubs";
import { uniquifySlug } from "@/lib/slug";
import { TAGS, type Tag } from "@/lib/tags";

export type CreateClubState = {
  error: string | null;
};

function oneOf<T extends string>(
  values: readonly T[],
  raw: FormDataEntryValue | null
): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

function optionalField(
  raw: FormDataEntryValue | null,
  max: number
): { value: string | null; tooLong: boolean } {
  const value = String(raw ?? "").trim();
  if (!value) return { value: null, tooLong: false };
  if (value.length > max) return { value: null, tooLong: true };
  return { value, tooLong: false };
}

export async function createClub(
  _prev: CreateClubState,
  formData: FormData
): Promise<CreateClubState> {
  // Server actions are reachable by direct POST, so the session check lives
  // here, not only in the page.
  const session = await auth();
  if (!session?.user) redirect("/login?next=/clubs/new");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = formData
    .getAll("tags")
    .filter((tag): tag is Tag => TAGS.includes(tag as Tag));
  const affiliation = oneOf(SWARTHMORE_AFFILIATIONS, formData.get("affiliation"));
  const size = oneOf(CLUB_SIZES, formData.get("size"));
  const membershipProcess = oneOf(
    MEMBERSHIP_PROCESSES,
    formData.get("membershipProcess")
  );
  const recruitingCycle = oneOf(
    RECRUITING_CYCLES,
    formData.get("recruitingCycle")
  );
  const isAcceptingMembers = formData.get("isAcceptingMembers") === "on";

  const instagram = optionalField(formData.get("instagram"), 80);
  const email = optionalField(formData.get("email"), 120);
  const website = optionalField(formData.get("website"), 200);
  const meetingInfo = optionalField(formData.get("meetingInfo"), 400);

  if (name.length < 2 || name.length > 120) {
    return { error: "Club name must be between 2 and 120 characters." };
  }
  if (description.length < 10 || description.length > 2000) {
    return { error: "Description must be between 10 and 2000 characters." };
  }
  if (tags.length === 0) {
    return { error: "Pick at least one tag." };
  }
  if (!affiliation || !size || !membershipProcess || !recruitingCycle) {
    return { error: "Please fill in every dropdown." };
  }
  if (instagram.tooLong || email.tooLong || website.tooLong || meetingInfo.tooLong) {
    return { error: "One of the contact fields is too long." };
  }
  if (email.value && !isLikelyEmail(email.value)) {
    return { error: "That email address does not look valid." };
  }
  if (website.value && /\s/.test(website.value)) {
    return { error: "Website should be a URL, without spaces." };
  }

  const taken = new Set(
    (
      await prisma.club.findMany({
        select: { slug: true },
      })
    ).map((row) => row.slug)
  );
  const slug = uniquifySlug(name, taken);

  const editor = session.user.name ?? session.user.email ?? "unknown";
  try {
    await prisma.club.create({
      data: {
        slug,
        name,
        description,
        tags,
        affiliation,
        size,
        isAcceptingMembers,
        membershipProcess,
        recruitingCycle,
        instagram: instagram.value,
        email: email.value,
        website: website.value,
        meetingInfo: meetingInfo.value,
        createdById: session.user.id,
        createdBy: editor,
        updatedById: session.user.id,
        updatedBy: editor,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A club with that name already exists." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${slug}`);
  redirect(`/clubs/${slug}`);
}
