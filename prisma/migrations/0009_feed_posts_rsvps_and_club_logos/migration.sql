-- AlterTable
ALTER TABLE "Club" ADD COLUMN "logoObjectKey" TEXT;

-- CreateTable
CREATE TABLE "ClubPost" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "imageObjectKey" TEXT,
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "rsvpCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostRsvp" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "browserIdHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubPost_createdAt_idx" ON "ClubPost"("createdAt");
CREATE INDEX "ClubPost_clubId_createdAt_idx" ON "ClubPost"("clubId", "createdAt");
CREATE INDEX "ClubPost_eventDate_eventTime_idx" ON "ClubPost"("eventDate", "eventTime");
CREATE UNIQUE INDEX "PostRsvp_postId_browserIdHash_key" ON "PostRsvp"("postId", "browserIdHash");
CREATE INDEX "PostRsvp_browserIdHash_idx" ON "PostRsvp"("browserIdHash");

-- AddForeignKey
ALTER TABLE "ClubPost" ADD CONSTRAINT "ClubPost_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostRsvp" ADD CONSTRAINT "PostRsvp_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClubPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
