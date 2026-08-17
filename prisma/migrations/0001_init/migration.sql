-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "position" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "affiliation" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "isAcceptingMembers" BOOLEAN NOT NULL,
    "membershipProcess" TEXT NOT NULL,
    "recruitingCycle" TEXT NOT NULL,
    "createdById" TEXT,
    "createdBy" TEXT,
    "updatedById" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

