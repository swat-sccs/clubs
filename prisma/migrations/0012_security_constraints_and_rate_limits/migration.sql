CREATE TABLE "ActionRateLimit" (
    "action" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionRateLimit_pkey" PRIMARY KEY ("action", "identifier", "windowStart"),
    CONSTRAINT "ActionRateLimit_count_check" CHECK ("count" > 0)
);

CREATE INDEX "ActionRateLimit_expiresAt_idx" ON "ActionRateLimit"("expiresAt");

CREATE TABLE "PendingObjectDeletion" (
    "objectKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingObjectDeletion_pkey" PRIMARY KEY ("objectKey"),
    CONSTRAINT "PendingObjectDeletion_attempts_check" CHECK ("attempts" >= 0)
);

CREATE INDEX "PendingObjectDeletion_createdAt_idx" ON "PendingObjectDeletion"("createdAt");

ALTER TABLE "Club"
  ADD CONSTRAINT "Club_size_check" CHECK ("size" IN (
    'less than 10 members', 'less than 20 members', '20 to 50 members',
    '50 to 100 members', 'more than 100'
  )),
  ADD CONSTRAINT "Club_membershipProcess_check" CHECK ("membershipProcess" IN (
    'Open Membership', 'Tryout Required', 'Audition Required',
    'Application Required', 'Application & Interview Required'
  )),
  ADD CONSTRAINT "Club_recruitingCycle_check" CHECK ("recruitingCycle" IN (
    'Open', 'Fall Semester', 'Spring Semester', 'Both Semesters', 'Unknown'
  ));

ALTER TABLE "ClubCreationRequest"
  ADD CONSTRAINT "ClubCreationRequest_size_check" CHECK ("size" IN (
    'less than 10 members', 'less than 20 members', '20 to 50 members',
    '50 to 100 members', 'more than 100'
  )),
  ADD CONSTRAINT "ClubCreationRequest_membershipProcess_check" CHECK ("membershipProcess" IN (
    'Open Membership', 'Tryout Required', 'Audition Required',
    'Application Required', 'Application & Interview Required'
  )),
  ADD CONSTRAINT "ClubCreationRequest_recruitingCycle_check" CHECK ("recruitingCycle" IN (
    'Open', 'Fall Semester', 'Spring Semester', 'Both Semesters', 'Unknown'
  ));

ALTER TABLE "ClubPost"
  ADD CONSTRAINT "ClubPost_eventDate_check" CHECK (
    "eventDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    AND to_char(to_date("eventDate", 'YYYY-MM-DD'), 'YYYY-MM-DD') = "eventDate"
  ),
  ADD CONSTRAINT "ClubPost_eventTime_check" CHECK (
    "eventTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  ADD CONSTRAINT "ClubPost_rsvpCount_check" CHECK ("rsvpCount" >= 0);
