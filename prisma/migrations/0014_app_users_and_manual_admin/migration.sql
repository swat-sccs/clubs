-- Keycloak remains the authentication provider. This table records only the
-- SCCS users who have signed in and the application-admin grants managed by
-- existing administrators.
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "email" TEXT,
    "isDirectoryAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isAppAdmin" BOOLEAN NOT NULL DEFAULT false,
    "firstSignedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSignedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");
CREATE INDEX "AppUser_lastSignedInAt_idx" ON "AppUser"("lastSignedInAt");
CREATE INDEX "AppUser_isAppAdmin_lastSignedInAt_idx" ON "AppUser"("isAppAdmin", "lastSignedInAt");
