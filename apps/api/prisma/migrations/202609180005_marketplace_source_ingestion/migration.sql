CREATE TYPE "MarketplaceProvider" AS ENUM ('GITHUB', 'NPM');
CREATE TYPE "MarketplaceSourceCheckStatus" AS ENUM ('PENDING', 'VERIFIED', 'STALE', 'RESTRICTED', 'FAILED');
CREATE TYPE "MarketplaceSourceCheckOutcome" AS ENUM ('VERIFIED', 'TRANSIENT_FAILURE', 'RATE_LIMITED', 'NOT_FOUND', 'OWNERSHIP_LOST', 'MISMATCH', 'CONFIGURATION_ERROR');
CREATE TYPE "MarketplaceSourceCheckJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'COMPLETED', 'FAILED', 'CANCELLED');

ALTER TABLE "MarketplaceReleaseManifest"
  ADD COLUMN "artifactSizeBytes" INTEGER,
  ADD COLUMN "resolvedInstallationUrl" TEXT,
  ADD COLUMN "sourceCheckStatus" "MarketplaceSourceCheckStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "sourceCheckedAt" TIMESTAMP(3),
  ADD COLUMN "sourceNextCheckAt" TIMESTAMP(3),
  ADD COLUMN "sourceFailureCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastSourceErrorCode" TEXT,
  ADD COLUMN "verifiedConnectionId" TEXT;

UPDATE "MarketplaceReleaseManifest"
SET "sourceCheckStatus" = 'VERIFIED',
    "sourceCheckedAt" = COALESCE("sourceResolvedAt", "ownershipVerifiedAt")
WHERE "sourceResolvedAt" IS NOT NULL
  AND "ownershipVerifiedAt" IS NOT NULL;

CREATE TABLE "MarketplaceProviderConnection" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "provider" "MarketplaceProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accountLogin" TEXT NOT NULL,
  "encryptedToken" TEXT NOT NULL,
  "tokenIv" TEXT NOT NULL,
  "tokenTag" TEXT NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceProviderConnection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceProviderConnection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "MarketplaceCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MarketplaceSourceCheck" (
  "id" TEXT NOT NULL,
  "releaseManifestId" TEXT NOT NULL,
  "connectionId" TEXT,
  "provider" "MarketplaceProvider" NOT NULL,
  "outcome" "MarketplaceSourceCheckOutcome" NOT NULL,
  "providerStatusCode" INTEGER,
  "resolvedSourceRef" TEXT,
  "resolvedInstallationUrl" TEXT,
  "providerIntegrityDigest" TEXT,
  "artifactSizeBytes" INTEGER,
  "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
  "errorCode" TEXT,
  "correlationId" TEXT NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceSourceCheck_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceSourceCheck_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceSourceCheck_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "MarketplaceProviderConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceSourceCheck_latency_check" CHECK ("latencyMs" >= 0),
  CONSTRAINT "MarketplaceSourceCheck_artifact_size_check" CHECK ("artifactSizeBytes" IS NULL OR "artifactSizeBytes" >= 0)
);

CREATE TABLE "MarketplaceSourceCheckJob" (
  "id" TEXT NOT NULL,
  "releaseManifestId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "status" "MarketplaceSourceCheckJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "correlationId" TEXT NOT NULL,
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceSourceCheckJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceSourceCheckJob_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceSourceCheckJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "MarketplaceProviderConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceSourceCheckJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceSourceCheckJob_attempts_check" CHECK ("attempts" >= 0)
);

CREATE UNIQUE INDEX "MarketplaceProviderConnection_creatorId_provider_key" ON "MarketplaceProviderConnection"("creatorId", "provider");
CREATE INDEX "MarketplaceProviderConnection_provider_providerAccountId_idx" ON "MarketplaceProviderConnection"("provider", "providerAccountId");
CREATE INDEX "MarketplaceProviderConnection_creatorId_revokedAt_idx" ON "MarketplaceProviderConnection"("creatorId", "revokedAt");
CREATE UNIQUE INDEX "MarketplaceSourceCheck_correlationId_key" ON "MarketplaceSourceCheck"("correlationId");
CREATE INDEX "MarketplaceSourceCheck_releaseManifestId_createdAt_idx" ON "MarketplaceSourceCheck"("releaseManifestId", "createdAt");
CREATE INDEX "MarketplaceSourceCheck_provider_outcome_createdAt_idx" ON "MarketplaceSourceCheck"("provider", "outcome", "createdAt");
CREATE UNIQUE INDEX "MarketplaceSourceCheckJob_correlationId_key" ON "MarketplaceSourceCheckJob"("correlationId");
CREATE INDEX "MarketplaceSourceCheckJob_status_nextAttemptAt_idx" ON "MarketplaceSourceCheckJob"("status", "nextAttemptAt");
CREATE INDEX "MarketplaceSourceCheckJob_releaseManifestId_createdAt_idx" ON "MarketplaceSourceCheckJob"("releaseManifestId", "createdAt");
CREATE INDEX "MarketplaceSourceCheckJob_lockedAt_idx" ON "MarketplaceSourceCheckJob"("lockedAt");
CREATE UNIQUE INDEX "MarketplaceSourceCheckJob_active_release_key"
  ON "MarketplaceSourceCheckJob"("releaseManifestId")
  WHERE "status" IN ('PENDING', 'PROCESSING', 'RETRY');
CREATE INDEX "MarketplaceReleaseManifest_sourceCheckStatus_sourceNextCheckAt_idx" ON "MarketplaceReleaseManifest"("sourceCheckStatus", "sourceNextCheckAt");
CREATE INDEX "MarketplaceReleaseManifest_verifiedConnectionId_idx" ON "MarketplaceReleaseManifest"("verifiedConnectionId");

ALTER TABLE "MarketplaceReleaseManifest"
  ADD CONSTRAINT "MarketplaceReleaseManifest_verifiedConnectionId_fkey"
  FOREIGN KEY ("verifiedConnectionId") REFERENCES "MarketplaceProviderConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_marketplace_source_check_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace source checks are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceSourceCheck_append_only"
BEFORE UPDATE OR DELETE ON "MarketplaceSourceCheck"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_source_check_mutation();

CREATE OR REPLACE FUNCTION prevent_published_marketplace_release_identity_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD."publishedAt" IS NOT NULL AND (
    NEW."productVersionId" IS DISTINCT FROM OLD."productVersionId" OR
    NEW."revision" IS DISTINCT FROM OLD."revision" OR
    NEW."manifestVersion" IS DISTINCT FROM OLD."manifestVersion" OR
    NEW."itemType" IS DISTINCT FROM OLD."itemType" OR
    NEW."sourceKind" IS DISTINCT FROM OLD."sourceKind" OR
    NEW."sourceUrl" IS DISTINCT FROM OLD."sourceUrl" OR
    NEW."sourceRef" IS DISTINCT FROM OLD."sourceRef" OR
    NEW."sourcePath" IS DISTINCT FROM OLD."sourcePath" OR
    NEW."providerIntegrityDigest" IS DISTINCT FROM OLD."providerIntegrityDigest" OR
    NEW."artifactSizeBytes" IS DISTINCT FROM OLD."artifactSizeBytes" OR
    NEW."resolvedInstallationUrl" IS DISTINCT FROM OLD."resolvedInstallationUrl" OR
    NEW."installationMethod" IS DISTINCT FROM OLD."installationMethod" OR
    NEW."installationInstructions" IS DISTINCT FROM OLD."installationInstructions" OR
    NEW."runtimeRequirements" IS DISTINCT FROM OLD."runtimeRequirements" OR
    NEW."accountRequirements" IS DISTINCT FROM OLD."accountRequirements" OR
    NEW."operatingSystems" IS DISTINCT FROM OLD."operatingSystems" OR
    NEW."dependencyRequirements" IS DISTINCT FROM OLD."dependencyRequirements" OR
    NEW."licenseIdentifier" IS DISTINCT FROM OLD."licenseIdentifier" OR
    NEW."customLicenseUrl" IS DISTINCT FROM OLD."customLicenseUrl" OR
    NEW."documentationUrl" IS DISTINCT FROM OLD."documentationUrl" OR
    NEW."supportUrl" IS DISTINCT FROM OLD."supportUrl" OR
    NEW."releaseNotes" IS DISTINCT FROM OLD."releaseNotes" OR
    NEW."publishedAt" IS DISTINCT FROM OLD."publishedAt" OR
    NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  ) THEN
    RAISE EXCEPTION 'Published marketplace release identity is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_marketplace_acquisition_release() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD."releaseManifestId" IS NOT NULL
    AND NEW."releaseManifestId" IS DISTINCT FROM OLD."releaseManifestId"
  THEN
    RAISE EXCEPTION 'Acquisition release identity is immutable';
  END IF;
  IF NEW."releaseManifestId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "MarketplaceReleaseManifest" release
    JOIN "MarketplaceProductVersion" version ON version."id" = release."productVersionId"
    WHERE release."id" = NEW."releaseManifestId"
      AND release."publishedAt" IS NOT NULL
      AND release."sourceCheckStatus" IN ('VERIFIED', 'STALE')
      AND version."productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Acquisition release must be an available published release of the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
