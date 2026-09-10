-- Keep an append-only record of material club changes and editor grants.
CREATE TABLE "ClubAuditLog" (
    "id" TEXT NOT NULL,
    "clubId" TEXT,
    "clubName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorId" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClubAuditLog_createdAt_idx" ON "ClubAuditLog"("createdAt");
CREATE INDEX "ClubAuditLog_clubId_createdAt_idx" ON "ClubAuditLog"("clubId", "createdAt");

ALTER TABLE "ClubAuditLog"
ADD CONSTRAINT "ClubAuditLog_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
