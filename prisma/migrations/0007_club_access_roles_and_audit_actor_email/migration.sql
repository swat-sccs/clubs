CREATE TYPE "ClubAccessRole" AS ENUM ('OWNER', 'EDITOR');

ALTER TABLE "ClubEditor"
ADD COLUMN "role" "ClubAccessRole" NOT NULL DEFAULT 'EDITOR';

-- Preserve the authority existing assignees had before named roles existed.
UPDATE "ClubEditor" SET "role" = 'OWNER';

ALTER TABLE "ClubAuditLog"
ADD COLUMN "actorEmail" TEXT;
