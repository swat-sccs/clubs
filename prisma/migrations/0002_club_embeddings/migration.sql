-- CreateTable
CREATE TABLE "ClubEmbedding" (
    "clubId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vector" DOUBLE PRECISION[],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubEmbedding_pkey" PRIMARY KEY ("clubId")
);

-- AddForeignKey
ALTER TABLE "ClubEmbedding" ADD CONSTRAINT "ClubEmbedding_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

