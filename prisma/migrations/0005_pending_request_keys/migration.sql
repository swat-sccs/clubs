-- Add nullable keys that enforce one active request while allowing request
-- history to contain any number of approved or rejected rows.
ALTER TABLE "ClubCreationRequest" ADD COLUMN "pendingKey" TEXT;
ALTER TABLE "ClubClaimRequest" ADD COLUMN "pendingKey" TEXT;

-- Backfill at most one key for each pending identity. The application already
-- treats any other pending rows as duplicates and will not create more.
WITH ranked AS (
    SELECT "id",
           lower(trim("name")) AS key,
           row_number() OVER (
               PARTITION BY lower(trim("name"))
               ORDER BY "createdAt", "id"
           ) AS row_number
    FROM "ClubCreationRequest"
    WHERE "status" = 'PENDING'
)
UPDATE "ClubCreationRequest" AS request
SET "pendingKey" = ranked.key
FROM ranked
WHERE request."id" = ranked."id" AND ranked.row_number = 1;

WITH ranked AS (
    SELECT "id",
           "clubId" || ':' || "requesterId" AS key,
           row_number() OVER (
               PARTITION BY "clubId", "requesterId"
               ORDER BY "createdAt", "id"
           ) AS row_number
    FROM "ClubClaimRequest"
    WHERE "status" = 'PENDING'
)
UPDATE "ClubClaimRequest" AS request
SET "pendingKey" = ranked.key
FROM ranked
WHERE request."id" = ranked."id" AND ranked.row_number = 1;

CREATE UNIQUE INDEX "ClubCreationRequest_pendingKey_key"
ON "ClubCreationRequest"("pendingKey");
CREATE UNIQUE INDEX "ClubClaimRequest_pendingKey_key"
ON "ClubClaimRequest"("pendingKey");

-- Preserve edit access for clubs submitted before moderation was introduced.
INSERT INTO "ClubEditor" ("id", "clubId", "userId", "name")
SELECT 'legacy-' || md5("id" || ':' || "createdById"), "id", "createdById", "createdBy"
FROM "Club"
WHERE "createdById" IS NOT NULL
ON CONFLICT ("clubId", "userId") DO NOTHING;
