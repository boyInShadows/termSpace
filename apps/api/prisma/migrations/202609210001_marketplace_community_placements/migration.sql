CREATE TYPE "MarketplaceCommunityPlacementState" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REMOVED');
CREATE TYPE "MarketplaceCommunityPlacementAction" AS ENUM ('APPROVED', 'REJECTED', 'REMOVED');

CREATE TABLE "MarketplaceCommunityPlacement" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "state" "MarketplaceCommunityPlacementState" NOT NULL DEFAULT 'REQUESTED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestedSnapshotId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "moderatedByUserId" TEXT,
  "decidedAt" TIMESTAMP(3),
  "publicReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceCommunityPlacement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceCommunityPlacementEvent" (
  "id" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "previousState" "MarketplaceCommunityPlacementState" NOT NULL,
  "resultingState" "MarketplaceCommunityPlacementState" NOT NULL,
  "action" "MarketplaceCommunityPlacementAction" NOT NULL,
  "actorType" "MarketplaceLifecycleActorType" NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "publicReason" TEXT,
  "internalNote" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceCommunityPlacementEvent_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MarketplaceCommunityPlacement" (
  "id", "productId", "communityId", "requestedSnapshotId", "requestedByUserId", "requestedAt", "createdAt", "updatedAt"
)
SELECT
  'placement_' || md5(request."productId" || ':' || request."communityId"),
  request."productId",
  request."communityId",
  request."snapshotId",
  request."requestedByUserId",
  request."createdAt",
  request."createdAt",
  request."createdAt"
FROM (
  SELECT DISTINCT ON ("productId", "communityId") *
  FROM "MarketplaceCommunityPlacementRequest"
  ORDER BY "productId", "communityId", "createdAt" DESC, "snapshotId" DESC
) request;

CREATE UNIQUE INDEX "MarketplaceCommunityPlacement_productId_communityId_key" ON "MarketplaceCommunityPlacement"("productId", "communityId");
CREATE INDEX "MarketplaceCommunityPlacement_communityId_state_updatedAt_idx" ON "MarketplaceCommunityPlacement"("communityId", "state", "updatedAt");
CREATE INDEX "MarketplaceCommunityPlacement_productId_state_idx" ON "MarketplaceCommunityPlacement"("productId", "state");
CREATE INDEX "MarketplaceCommunityPlacement_requestedByUserId_requestedAt_idx" ON "MarketplaceCommunityPlacement"("requestedByUserId", "requestedAt");
CREATE UNIQUE INDEX "MarketplaceCommunityPlacementEvent_correlationId_key" ON "MarketplaceCommunityPlacementEvent"("correlationId");
CREATE INDEX "MarketplaceCommunityPlacementEvent_placementId_createdAt_idx" ON "MarketplaceCommunityPlacementEvent"("placementId", "createdAt");
CREATE INDEX "MarketplaceCommunityPlacementEvent_actorUserId_createdAt_idx" ON "MarketplaceCommunityPlacementEvent"("actorUserId", "createdAt");

ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "MarketplaceCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_requestedSnapshotId_fkey" FOREIGN KEY ("requestedSnapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_moderatedByUserId_fkey" FOREIGN KEY ("moderatedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementEvent" ADD CONSTRAINT "MarketplaceCommunityPlacementEvent_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "MarketplaceCommunityPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementEvent" ADD CONSTRAINT "MarketplaceCommunityPlacementEvent_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementEvent" ADD CONSTRAINT "MarketplaceCommunityPlacementEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_marketplace_community_placement_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace community placement events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceCommunityPlacementEvent_append_only"
BEFORE UPDATE OR DELETE ON "MarketplaceCommunityPlacementEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_community_placement_event_mutation();

CREATE FUNCTION enforce_marketplace_community_placement_snapshot_ownership() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "MarketplaceListingSnapshot"
    WHERE "id" = NEW."requestedSnapshotId" AND "productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Community placement snapshot must belong to the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceCommunityPlacement_snapshot_ownership"
BEFORE INSERT OR UPDATE OF "requestedSnapshotId", "productId" ON "MarketplaceCommunityPlacement"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_community_placement_snapshot_ownership();
