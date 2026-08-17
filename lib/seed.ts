import { prisma } from "./db";
import type { Club } from "./clubs";
import seedClubs from "./clubs.json";

/**
 * Import the original static directory into an empty database. Runs at server
 * startup (see instrumentation.ts) and is a no-op once any club exists, so
 * deploys never clobber user-submitted data.
 */
export async function seedIfEmpty(): Promise<void> {
  const existing = await prisma.club.count();
  if (existing > 0) return;

  const clubs = seedClubs as Club[];
  // createMany keeps array order, so the autoincrementing position column
  // preserves the curated ordering of the JSON file.
  await prisma.club.createMany({
    data: clubs.map((club) => ({ ...club, tags: [...club.tags] })),
    skipDuplicates: true,
  });
  console.log(`Seeded ${clubs.length} clubs from lib/clubs.json`);
}
