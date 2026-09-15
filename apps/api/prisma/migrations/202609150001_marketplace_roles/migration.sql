CREATE TYPE "MarketplaceRole" AS ENUM ('CREATOR', 'MODERATOR', 'ADMINISTRATOR');
CREATE TYPE "MarketplaceRoleEventAction" AS ENUM ('GRANTED', 'REVOKED');

ALTER TABLE "ReaderUser" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Existing Google identities were accepted only after Google asserted a verified
-- email address. Password-only accounts remain unverified until a first-party
-- email verification flow is implemented.
UPDATE "ReaderUser"
SET "emailVerifiedAt" = COALESCE("updatedAt", "createdAt")
WHERE "googleSubject" IS NOT NULL;

CREATE TABLE "MarketplaceRoleGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MarketplaceRole" NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceRoleGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceRoleEvent" (
  "id" TEXT NOT NULL,
  "subjectUserId" TEXT NOT NULL,
  "role" "MarketplaceRole" NOT NULL,
  "action" "MarketplaceRoleEventAction" NOT NULL,
  "actor" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceRoleEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceRoleGrant_userId_role_key"
  ON "MarketplaceRoleGrant"("userId", "role");
CREATE INDEX "MarketplaceRoleGrant_userId_revokedAt_idx"
  ON "MarketplaceRoleGrant"("userId", "revokedAt");
CREATE INDEX "MarketplaceRoleGrant_role_revokedAt_idx"
  ON "MarketplaceRoleGrant"("role", "revokedAt");
CREATE UNIQUE INDEX "MarketplaceRoleEvent_correlationId_key"
  ON "MarketplaceRoleEvent"("correlationId");
CREATE INDEX "MarketplaceRoleEvent_subjectUserId_createdAt_idx"
  ON "MarketplaceRoleEvent"("subjectUserId", "createdAt");
CREATE INDEX "MarketplaceRoleEvent_role_createdAt_idx"
  ON "MarketplaceRoleEvent"("role", "createdAt");

ALTER TABLE "MarketplaceRoleGrant"
  ADD CONSTRAINT "MarketplaceRoleGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceRoleEvent"
  ADD CONSTRAINT "MarketplaceRoleEvent_subjectUserId_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "ReaderUser"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
