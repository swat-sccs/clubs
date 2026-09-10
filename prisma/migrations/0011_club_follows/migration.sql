-- Track clubs followed by authenticated SCCS users. Users live in Keycloak,
-- so the stable subject id is stored directly instead of a local User row.
CREATE TABLE "ClubFollow" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubFollow_clubId_userId_key" ON "ClubFollow"("clubId", "userId");
CREATE INDEX "ClubFollow_userId_createdAt_idx" ON "ClubFollow"("userId", "createdAt");

ALTER TABLE "ClubFollow"
ADD CONSTRAINT "ClubFollow_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
