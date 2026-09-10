-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Council affiliation is no longer part of club profiles.
ALTER TABLE "Club" DROP COLUMN "affiliation";

-- CreateTable
CREATE TABLE "ClubEditor" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "username" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubEditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubCreationRequest" (
    "id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "size" TEXT NOT NULL,
    "isAcceptingMembers" BOOLEAN NOT NULL,
    "membershipProcess" TEXT NOT NULL,
    "recruitingCycle" TEXT NOT NULL,
    "instagram" TEXT,
    "email" TEXT,
    "website" TEXT,
    "meetingInfo" TEXT,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "requesterUsername" TEXT,
    "reviewedById" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "clubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubCreationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubClaimRequest" (
    "id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "clubId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "requesterUsername" TEXT,
    "reviewedById" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubEditor_clubId_userId_key" ON "ClubEditor"("clubId", "userId");
CREATE INDEX "ClubEditor_userId_idx" ON "ClubEditor"("userId");
CREATE UNIQUE INDEX "ClubCreationRequest_clubId_key" ON "ClubCreationRequest"("clubId");
CREATE INDEX "ClubCreationRequest_status_createdAt_idx" ON "ClubCreationRequest"("status", "createdAt");
CREATE INDEX "ClubCreationRequest_requesterId_status_idx" ON "ClubCreationRequest"("requesterId", "status");
CREATE INDEX "ClubClaimRequest_status_createdAt_idx" ON "ClubClaimRequest"("status", "createdAt");
CREATE INDEX "ClubClaimRequest_clubId_requesterId_status_idx" ON "ClubClaimRequest"("clubId", "requesterId", "status");

-- AddForeignKey
ALTER TABLE "ClubEditor" ADD CONSTRAINT "ClubEditor_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubCreationRequest" ADD CONSTRAINT "ClubCreationRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClubClaimRequest" ADD CONSTRAINT "ClubClaimRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
