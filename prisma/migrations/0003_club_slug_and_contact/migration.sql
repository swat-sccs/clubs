-- AlterTable
ALTER TABLE "Club" ADD COLUMN "slug" TEXT;
ALTER TABLE "Club" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Club" ADD COLUMN "email" TEXT;
ALTER TABLE "Club" ADD COLUMN "website" TEXT;
ALTER TABLE "Club" ADD COLUMN "meetingInfo" TEXT;

-- Backfill slugs from names. Punctuation collapses to hyphens.
UPDATE "Club"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

UPDATE "Club"
SET "slug" = "id"
WHERE "slug" IS NULL OR "slug" = '';

-- Reserved paths under /clubs/*
UPDATE "Club"
SET "slug" = "slug" || '-club'
WHERE "slug" IN ('new', 'edit');

-- Break any collisions so the unique index can land.
UPDATE "Club" AS c
SET "slug" = c."slug" || '-' || left(c."id", 8)
WHERE c."id" IN (
  SELECT "id" FROM (
    SELECT "id",
           row_number() OVER (PARTITION BY "slug" ORDER BY "position", "id") AS n
    FROM "Club"
  ) ranked
  WHERE ranked.n > 1
);

ALTER TABLE "Club" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");
