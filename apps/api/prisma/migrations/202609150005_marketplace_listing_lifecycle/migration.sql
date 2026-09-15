CREATE TYPE "MarketplaceListingState" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "MarketplaceLifecycleActorType" AS ENUM ('SYSTEM', 'CREATOR', 'MODERATOR', 'ADMINISTRATOR');
CREATE TYPE "MarketplaceListingLifecycleAction" AS ENUM ('DRAFT_SAVED', 'SUBMITTED', 'WITHDRAWN', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUSPENDED', 'REINSTATED', 'ARCHIVED', 'RESTORED');

ALTER TABLE "MarketplaceProduct"
  ADD COLUMN "lifecycleState" "MarketplaceListingState" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "lifecycleVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lifecycleResumeState" "MarketplaceListingState",
  ADD COLUMN "lifecycleResumePublished" BOOLEAN,
  ADD COLUMN "approvedSnapshotId" TEXT,
  ADD COLUMN "proposedSnapshotId" TEXT;

CREATE TABLE "MarketplaceListingSnapshot" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "manifestSnapshotId" TEXT,
  "releaseManifestId" TEXT,
  "revision" INTEGER NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "digestSha256" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "createdByActor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceListingSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceListingSnapshot_manifest_links_check" CHECK (
    ("schemaVersion" = 0 AND "manifestSnapshotId" IS NULL AND "releaseManifestId" IS NULL) OR
    ("schemaVersion" > 0 AND "manifestSnapshotId" IS NOT NULL AND "releaseManifestId" IS NOT NULL)
  )
);

CREATE TABLE "MarketplaceListingLifecycleEvent" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "snapshotId" TEXT,
  "previousState" "MarketplaceListingState",
  "resultingState" "MarketplaceListingState" NOT NULL,
  "action" "MarketplaceListingLifecycleAction" NOT NULL,
  "actorType" "MarketplaceLifecycleActorType" NOT NULL,
  "actorUserId" TEXT,
  "reasonCode" TEXT NOT NULL,
  "publicReason" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceListingLifecycleEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceListingLifecycleEvent_actor_check" CHECK (
    ("actorType" = 'SYSTEM' AND "actorUserId" IS NULL) OR
    ("actorType" <> 'SYSTEM' AND "actorUserId" IS NOT NULL)
  )
);

WITH legacy_snapshots AS (
  SELECT
    "id" AS "productId",
    jsonb_build_object(
      'schemaVersion', 0,
      'legacy', true,
      'listing', jsonb_build_object(
        'slug', "slug",
        'name', "name",
        'type', "type",
        'itemType', "itemType",
        'outcome', "outcome",
        'description', "description",
        'categoryId', "categoryId",
        'platforms', "platforms",
        'models', "models",
        'tags', "tags",
        'benefits', "benefits",
        'useCases', "useCases",
        'includedFiles', "includedFiles",
        'exampleInput', "exampleInput",
        'exampleOutputTitle', "exampleOutputTitle",
        'exampleOutputBody', "exampleOutputBody",
        'installationSteps', "installationSteps",
        'previewFiles', "previewFiles",
        'previewExcerpt', "previewExcerpt",
        'requirements', "requirements",
        'permissions', "permissions",
        'license', "license"
      )
    ) AS "content"
  FROM "MarketplaceProduct"
)
INSERT INTO "MarketplaceListingSnapshot" (
  "id", "productId", "revision", "schemaVersion", "digestSha256", "content", "createdByActor"
)
SELECT
  'mls_' || md5("productId"),
  "productId",
  1,
  0,
  encode(sha256(convert_to("content"::text, 'UTF8')), 'hex'),
  "content",
  'system:legacy-lifecycle-backfill'
FROM legacy_snapshots;

UPDATE "MarketplaceProduct"
SET
  "lifecycleState" = CASE WHEN "published" THEN 'PUBLISHED'::"MarketplaceListingState" ELSE 'DRAFT'::"MarketplaceListingState" END,
  "approvedSnapshotId" = CASE WHEN "published" THEN 'mls_' || md5("id") ELSE NULL END,
  "proposedSnapshotId" = CASE WHEN "published" THEN NULL ELSE 'mls_' || md5("id") END;

INSERT INTO "MarketplaceListingLifecycleEvent" (
  "id", "productId", "snapshotId", "previousState", "resultingState", "action",
  "actorType", "actorUserId", "reasonCode", "publicReason", "correlationId"
)
SELECT
  'mle_' || md5("id"),
  "id",
  COALESCE("approvedSnapshotId", "proposedSnapshotId"),
  NULL,
  "lifecycleState",
  CASE WHEN "published" THEN 'PUBLISHED'::"MarketplaceListingLifecycleAction" ELSE 'DRAFT_SAVED'::"MarketplaceListingLifecycleAction" END,
  'SYSTEM',
  NULL,
  'LEGACY_BACKFILL',
  NULL,
  'legacy-listing-' || "id"
FROM "MarketplaceProduct";

ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_lifecycle_state_check" CHECK (
  ("approvedSnapshotId" IS NULL OR "proposedSnapshotId" IS NULL OR "approvedSnapshotId" <> "proposedSnapshotId") AND
  ("published" = false OR "approvedSnapshotId" IS NOT NULL) AND
  ("lifecycleState" <> 'PUBLISHED' OR "published" = true) AND
  ("lifecycleState" NOT IN ('SUSPENDED', 'ARCHIVED') OR "published" = false) AND
  ("lifecycleState" NOT IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED') OR "proposedSnapshotId" IS NOT NULL) AND
  (("lifecycleResumeState" IS NULL AND "lifecycleResumePublished" IS NULL) OR ("lifecycleResumeState" IS NOT NULL AND "lifecycleResumePublished" IS NOT NULL)) AND
  ("lifecycleState" IN ('SUSPENDED', 'ARCHIVED') OR ("lifecycleResumeState" IS NULL AND "lifecycleResumePublished" IS NULL)) AND
  ("lifecycleState" NOT IN ('SUSPENDED', 'ARCHIVED') OR "lifecycleResumeState" IS NOT NULL)
);

CREATE UNIQUE INDEX "MarketplaceProduct_approvedSnapshotId_key" ON "MarketplaceProduct"("approvedSnapshotId");
CREATE UNIQUE INDEX "MarketplaceProduct_proposedSnapshotId_key" ON "MarketplaceProduct"("proposedSnapshotId");
CREATE INDEX "MarketplaceProduct_creatorId_lifecycleState_updatedAt_idx" ON "MarketplaceProduct"("creatorId", "lifecycleState", "updatedAt");
CREATE INDEX "MarketplaceProduct_lifecycleState_updatedAt_idx" ON "MarketplaceProduct"("lifecycleState", "updatedAt");
CREATE UNIQUE INDEX "MarketplaceListingSnapshot_manifestSnapshotId_key" ON "MarketplaceListingSnapshot"("manifestSnapshotId");
CREATE UNIQUE INDEX "MarketplaceListingSnapshot_releaseManifestId_key" ON "MarketplaceListingSnapshot"("releaseManifestId");
CREATE UNIQUE INDEX "MarketplaceListingSnapshot_productId_revision_key" ON "MarketplaceListingSnapshot"("productId", "revision");
CREATE INDEX "MarketplaceListingSnapshot_productId_createdAt_idx" ON "MarketplaceListingSnapshot"("productId", "createdAt");
CREATE INDEX "MarketplaceListingSnapshot_digestSha256_idx" ON "MarketplaceListingSnapshot"("digestSha256");
CREATE UNIQUE INDEX "MarketplaceListingLifecycleEvent_correlationId_key" ON "MarketplaceListingLifecycleEvent"("correlationId");
CREATE INDEX "MarketplaceListingLifecycleEvent_productId_createdAt_idx" ON "MarketplaceListingLifecycleEvent"("productId", "createdAt");
CREATE INDEX "MarketplaceListingLifecycleEvent_actorUserId_createdAt_idx" ON "MarketplaceListingLifecycleEvent"("actorUserId", "createdAt");
CREATE INDEX "MarketplaceListingLifecycleEvent_resultingState_createdAt_idx" ON "MarketplaceListingLifecycleEvent"("resultingState", "createdAt");

ALTER TABLE "MarketplaceListingSnapshot" ADD CONSTRAINT "MarketplaceListingSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListingSnapshot" ADD CONSTRAINT "MarketplaceListingSnapshot_manifestSnapshotId_fkey" FOREIGN KEY ("manifestSnapshotId") REFERENCES "MarketplaceManifestSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListingSnapshot" ADD CONSTRAINT "MarketplaceListingSnapshot_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_approvedSnapshotId_fkey" FOREIGN KEY ("approvedSnapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_proposedSnapshotId_fkey" FOREIGN KEY ("proposedSnapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListingLifecycleEvent" ADD CONSTRAINT "MarketplaceListingLifecycleEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListingLifecycleEvent" ADD CONSTRAINT "MarketplaceListingLifecycleEvent_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListingLifecycleEvent" ADD CONSTRAINT "MarketplaceListingLifecycleEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_marketplace_listing_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace listing snapshots and lifecycle events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceListingSnapshot_append_only"
BEFORE UPDATE OR DELETE ON "MarketplaceListingSnapshot"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_listing_audit_mutation();

CREATE TRIGGER "MarketplaceListingLifecycleEvent_append_only"
BEFORE UPDATE OR DELETE ON "MarketplaceListingLifecycleEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_listing_audit_mutation();

CREATE FUNCTION enforce_marketplace_listing_reference_ownership() RETURNS trigger AS $$
BEGIN
  IF NEW."approvedSnapshotId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "MarketplaceListingSnapshot" WHERE "id" = NEW."approvedSnapshotId" AND "productId" = NEW."id"
  ) THEN
    RAISE EXCEPTION 'Approved snapshot must belong to the same listing';
  END IF;
  IF NEW."proposedSnapshotId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "MarketplaceListingSnapshot" WHERE "id" = NEW."proposedSnapshotId" AND "productId" = NEW."id"
  ) THEN
    RAISE EXCEPTION 'Proposed snapshot must belong to the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceProduct_snapshot_ownership"
BEFORE INSERT OR UPDATE OF "approvedSnapshotId", "proposedSnapshotId" ON "MarketplaceProduct"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_listing_reference_ownership();

CREATE FUNCTION enforce_marketplace_listing_snapshot_links() RETURNS trigger AS $$
BEGIN
  IF NEW."manifestSnapshotId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "MarketplaceManifestSnapshot" WHERE "id" = NEW."manifestSnapshotId" AND "productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Manifest snapshot must belong to the same listing';
  END IF;
  IF NEW."releaseManifestId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "MarketplaceReleaseManifest" release
    JOIN "MarketplaceProductVersion" version ON version."id" = release."productVersionId"
    WHERE release."id" = NEW."releaseManifestId" AND version."productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Release manifest must belong to the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceListingSnapshot_link_ownership"
BEFORE INSERT OR UPDATE ON "MarketplaceListingSnapshot"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_listing_snapshot_links();

CREATE FUNCTION enforce_marketplace_listing_event_snapshot() RETURNS trigger AS $$
BEGIN
  IF NEW."snapshotId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "MarketplaceListingSnapshot" WHERE "id" = NEW."snapshotId" AND "productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Lifecycle event snapshot must belong to the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceListingLifecycleEvent_snapshot_ownership"
BEFORE INSERT ON "MarketplaceListingLifecycleEvent"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_listing_event_snapshot();
