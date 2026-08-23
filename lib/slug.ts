const RESERVED_CLUB_SLUGS = new Set(["new", "edit"]);

/** URL slug from a club name. Empty / reserved results become "club". */
export function slugifyClubName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!slug || RESERVED_CLUB_SLUGS.has(slug)) return slug ? `${slug}-club` : "club";
  return slug;
}

/** First unused slug, given slugs already taken (exact match). */
export function uniquifySlug(
  name: string,
  taken: ReadonlySet<string>
): string {
  const base = slugifyClubName(name);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
