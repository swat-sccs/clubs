import "server-only";

import { isLikelyEmail } from "@/lib/contact";
import {
  CLUB_SIZES,
  MEMBERSHIP_PROCESSES,
  RECRUITING_CYCLES,
  type Club,
} from "@/lib/clubs";
import { TAGS, type Tag } from "@/lib/tags";

type ClubFields = Omit<Club, "id" | "slug" | "hasLogo">;

function oneOf<T extends string>(
  values: readonly T[],
  raw: FormDataEntryValue | null,
): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

function optionalField(raw: FormDataEntryValue | null, max: number) {
  const value = String(raw ?? "").trim();
  if (!value) return { value: null, tooLong: false };
  return { value: value.length <= max ? value : null, tooLong: value.length > max };
}

export function parseClubFormData(
  formData: FormData,
): { data: ClubFields; error: null } | { data: null; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = Array.from(
    new Set(
      formData
        .getAll("tags")
        .filter((tag): tag is Tag => TAGS.includes(tag as Tag)),
    ),
  );
  const size = oneOf(CLUB_SIZES, formData.get("size"));
  const membershipProcess = oneOf(
    MEMBERSHIP_PROCESSES,
    formData.get("membershipProcess"),
  );
  const recruitingCycle = oneOf(
    RECRUITING_CYCLES,
    formData.get("recruitingCycle"),
  );
  const isAcceptingMembers = formData.get("isAcceptingMembers") === "on";
  const instagram = optionalField(formData.get("instagram"), 80);
  const email = optionalField(formData.get("email"), 120);
  const website = optionalField(formData.get("website"), 200);
  const meetingInfo = optionalField(formData.get("meetingInfo"), 400);

  if (name.length < 2 || name.length > 120) {
    return { data: null, error: "Club name must be between 2 and 120 characters." };
  }
  if (description.length < 10 || description.length > 2000) {
    return { data: null, error: "Description must be between 10 and 2000 characters." };
  }
  if (tags.length === 0) return { data: null, error: "Pick at least one tag." };
  if (!size || !membershipProcess || !recruitingCycle) {
    return { data: null, error: "Please fill in every dropdown." };
  }
  if (instagram.tooLong || email.tooLong || website.tooLong || meetingInfo.tooLong) {
    return { data: null, error: "One of the contact fields is too long." };
  }
  if (email.value && !isLikelyEmail(email.value)) {
    return { data: null, error: "That email address does not look valid." };
  }
  if (website.value && /\s/.test(website.value)) {
    return { data: null, error: "Website should be a URL, without spaces." };
  }

  return {
    data: {
      name,
      description,
      tags,
      size,
      isAcceptingMembers,
      membershipProcess,
      recruitingCycle,
      instagram: instagram.value,
      email: email.value,
      website: website.value,
      meetingInfo: meetingInfo.value,
    },
    error: null,
  };
}
