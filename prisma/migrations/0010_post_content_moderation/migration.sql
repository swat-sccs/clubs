-- CreateEnum
CREATE TYPE "PostModerationStatus" AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'DENIED');

-- AlterTable
ALTER TABLE "ClubPost"
ADD COLUMN "moderationStatus" "PostModerationStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "moderationNote" TEXT,
ADD COLUMN "imageModerationFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedTextHash" TEXT,
ADD COLUMN "approvedImageObjectKey" TEXT,
ADD COLUMN "moderationReviewedById" TEXT,
ADD COLUMN "moderationReviewedBy" TEXT,
ADD COLUMN "moderationReviewedAt" TIMESTAMP(3);

-- Existing posts predate automated moderation and remain published. Their
-- current text and image will be checked the next time an editor changes them.

-- CreateIndex
CREATE INDEX "ClubPost_moderationStatus_createdAt_idx" ON "ClubPost"("moderationStatus", "createdAt");
