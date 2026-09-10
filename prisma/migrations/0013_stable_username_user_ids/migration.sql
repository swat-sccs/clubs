-- SCCS Keycloak subject identifiers can vary between sessions in the current
-- provider configuration. Use the canonical preferred_username claim as the
-- application identity wherever it is available.
CREATE TEMP TABLE "_StableUserIdentityMap" ON COMMIT DROP AS
WITH candidates AS (
    SELECT "userId" AS "oldUserId", 'username:' || lower(btrim("username")) AS "newUserId"
    FROM "ClubEditor"
    WHERE "username" IS NOT NULL AND btrim("username") <> ''
    UNION ALL
    SELECT "requesterId", 'username:' || lower(btrim("requesterUsername"))
    FROM "ClubCreationRequest"
    WHERE "requesterUsername" IS NOT NULL AND btrim("requesterUsername") <> ''
    UNION ALL
    SELECT "requesterId", 'username:' || lower(btrim("requesterUsername"))
    FROM "ClubClaimRequest"
    WHERE "requesterUsername" IS NOT NULL AND btrim("requesterUsername") <> ''
)
SELECT "oldUserId", min("newUserId") AS "newUserId"
FROM candidates
GROUP BY "oldUserId"
HAVING count(DISTINCT "newUserId") = 1;

-- Collapse duplicate assignments that were created for the same username
-- under rotating subject ids. Prefer retaining Owner access, then the oldest
-- assignment.
WITH ranked AS (
    SELECT
        editor."id",
        row_number() OVER (
            PARTITION BY editor."clubId", coalesce(identity."newUserId", editor."userId")
            ORDER BY (editor."role" = 'OWNER') DESC, editor."grantedAt" ASC, editor."id" ASC
        ) AS rank
    FROM "ClubEditor" AS editor
    LEFT JOIN "_StableUserIdentityMap" AS identity
        ON identity."oldUserId" = editor."userId"
)
DELETE FROM "ClubEditor" AS editor
USING ranked
WHERE editor."id" = ranked."id" AND ranked.rank > 1;

-- Collapse duplicate follows before rewriting their unique user keys.
WITH ranked AS (
    SELECT
        follow."id",
        row_number() OVER (
            PARTITION BY follow."clubId", coalesce(identity."newUserId", follow."userId")
            ORDER BY follow."createdAt" ASC, follow."id" ASC
        ) AS rank
    FROM "ClubFollow" AS follow
    LEFT JOIN "_StableUserIdentityMap" AS identity
        ON identity."oldUserId" = follow."userId"
)
DELETE FROM "ClubFollow" AS follow
USING ranked
WHERE follow."id" = ranked."id" AND ranked.rank > 1;

UPDATE "ClubEditor" AS editor
SET "userId" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE editor."userId" = identity."oldUserId";

UPDATE "ClubFollow" AS follow
SET "userId" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE follow."userId" = identity."oldUserId";

UPDATE "ClubCreationRequest"
SET "requesterId" = 'username:' || lower(btrim("requesterUsername"))
WHERE "requesterUsername" IS NOT NULL AND btrim("requesterUsername") <> '';

UPDATE "ClubClaimRequest"
SET "requesterId" = 'username:' || lower(btrim("requesterUsername"))
WHERE "requesterUsername" IS NOT NULL AND btrim("requesterUsername") <> '';

-- Rebuild pending claim keys after requester ids change. Only one key is
-- needed per club/user pair; the query checks all matching pending rows.
UPDATE "ClubClaimRequest"
SET "pendingKey" = NULL
WHERE "status" = 'PENDING';

WITH ranked AS (
    SELECT
        "id",
        row_number() OVER (
            PARTITION BY "clubId", "requesterId"
            ORDER BY "createdAt" ASC, "id" ASC
        ) AS rank
    FROM "ClubClaimRequest"
    WHERE "status" = 'PENDING'
)
UPDATE "ClubClaimRequest" AS request
SET "pendingKey" = request."clubId" || ':' || request."requesterId"
FROM ranked
WHERE request."id" = ranked."id" AND ranked.rank = 1;

-- Preserve stable identity references in historical and authored records when
-- a trustworthy username mapping is available.
UPDATE "Club" AS club
SET "createdById" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE club."createdById" = identity."oldUserId";

UPDATE "Club" AS club
SET "updatedById" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE club."updatedById" = identity."oldUserId";

UPDATE "ClubPost" AS post
SET "authorId" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE post."authorId" = identity."oldUserId";

UPDATE "ClubPost" AS post
SET "moderationReviewedById" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE post."moderationReviewedById" = identity."oldUserId";

UPDATE "ClubCreationRequest" AS request
SET "reviewedById" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE request."reviewedById" = identity."oldUserId";

UPDATE "ClubClaimRequest" AS request
SET "reviewedById" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE request."reviewedById" = identity."oldUserId";

UPDATE "ClubAuditLog" AS log
SET "actorId" = identity."newUserId"
FROM "_StableUserIdentityMap" AS identity
WHERE log."actorId" = identity."oldUserId";
