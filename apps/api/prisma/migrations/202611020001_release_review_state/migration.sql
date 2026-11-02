-- The review signal belongs to the immutable release, not the mutable listing
-- row. A review is written once, when staff approve the snapshot that pins this
-- release, so editing a listing's copy cannot inherit somebody else's review.
ALTER TABLE "MarketplaceReleaseManifest"
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByUserId" TEXT;

CREATE INDEX "MarketplaceReleaseManifest_reviewedAt_idx" ON "MarketplaceReleaseManifest"("reviewedAt");

ALTER TABLE "MarketplaceReleaseManifest"
  ADD CONSTRAINT "MarketplaceReleaseManifest_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every listing that is publicly visible now was approved by staff.
-- The newest staff decision that promoted its currently approved snapshot is
-- the review of that snapshot's release. System bootstrap rows are not reviews.
-- Published releases are immutable by trigger, so the review metadata is written
-- with that guard off for the duration of this statement only; the trigger is
-- re-enabled before the migration ends.
ALTER TABLE "MarketplaceReleaseManifest" DISABLE TRIGGER "MarketplaceReleaseManifest_immutable_when_published";

WITH decisions AS (
  SELECT DISTINCT ON (product.id)
    product.id AS product_id,
    snapshot."releaseManifestId" AS release_id,
    event."createdAt" AS reviewed_at,
    event."actorUserId" AS reviewed_by
  FROM "MarketplaceProduct" product
  JOIN "MarketplaceListingSnapshot" snapshot ON snapshot.id = product."approvedSnapshotId"
  JOIN "MarketplaceListingLifecycleEvent" event
    ON event."productId" = product.id
   AND event."action" IN ('APPROVED', 'PUBLISHED')
   AND event."actorType" IN ('MODERATOR', 'ADMINISTRATOR')
  WHERE product.published = true
  ORDER BY product.id, event."createdAt" DESC
)
UPDATE "MarketplaceReleaseManifest" release
SET "reviewedAt" = decisions.reviewed_at,
    "reviewedByUserId" = decisions.reviewed_by
FROM decisions
WHERE release.id = decisions.release_id
  AND release."reviewedAt" IS NULL;

ALTER TABLE "MarketplaceReleaseManifest" ENABLE TRIGGER "MarketplaceReleaseManifest_immutable_when_published";

-- Keep the list projection in step with the signal it now mirrors, so the card,
-- the badge and the "Reviewed only" filter cannot disagree with the release.
UPDATE "MarketplaceProduct" product
SET "verified" = true
WHERE product.published = true
  AND EXISTS (
    SELECT 1
    FROM "MarketplaceListingSnapshot" snapshot
    JOIN "MarketplaceReleaseManifest" release ON release.id = snapshot."releaseManifestId"
    WHERE snapshot.id = product."approvedSnapshotId"
      AND release."reviewedAt" IS NOT NULL
  );
