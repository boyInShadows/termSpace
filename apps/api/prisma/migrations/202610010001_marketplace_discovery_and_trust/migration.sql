-- CreateEnum
CREATE TYPE "MarketplacePlacementState" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "MarketplaceTrustTarget" AS ENUM ('PRODUCT', 'RELEASE', 'PLACEMENT', 'CREATOR', 'REVIEW', 'USER');

-- CreateEnum
CREATE TYPE "MarketplaceCaseState" AS ENUM ('NEW', 'TRIAGED', 'INVESTIGATING', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "MarketplaceCaseSeverity" AS ENUM ('STANDARD', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MarketplaceAppealOutcome" AS ENUM ('PENDING', 'UPHELD', 'MODIFIED', 'REVERSED');

-- AlterTable
ALTER TABLE "MarketplaceCommunity" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#0f766e';

-- CreateTable
CREATE TABLE "MarketplaceCommunityPlacement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "approvedSnapshotId" TEXT,
    "state" "MarketplacePlacementState" NOT NULL DEFAULT 'REQUESTED',
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "publicReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketplaceCommunityPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePlacementEvent" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "state" "MarketplacePlacementState" NOT NULL,
    "publicReason" TEXT,
    "internalNote" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePlacementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCollection" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCollectionItem" (
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "MarketplaceCollectionItem_pkey" PRIMARY KEY ("collectionId","productId")
);

-- CreateTable
CREATE TABLE "MarketplaceTrustCase" (
    "id" TEXT NOT NULL,
    "targetType" "MarketplaceTrustTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "dedupKey" TEXT,
    "productId" TEXT,
    "creatorId" TEXT,
    "ownerUserId" TEXT,
    "releaseId" TEXT,
    "placementId" TEXT,
    "reviewId" TEXT,
    "state" "MarketplaceCaseState" NOT NULL DEFAULT 'NEW',
    "severity" "MarketplaceCaseSeverity" NOT NULL DEFAULT 'STANDARD',
    "version" INTEGER NOT NULL DEFAULT 0,
    "publicReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTrustCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceReport" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceRestriction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "activeKey" TEXT,
    "decisionEventId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTrustEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousState" "MarketplaceCaseState" NOT NULL,
    "resultingState" "MarketplaceCaseState" NOT NULL,
    "publicReason" TEXT NOT NULL,
    "internalNote" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceTrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceAppeal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decisionEventId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "outcome" "MarketplaceAppealOutcome" NOT NULL DEFAULT 'PENDING',
    "publicReason" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplaceCommunityPlacement_communityId_state_requestedAt_idx" ON "MarketplaceCommunityPlacement"("communityId", "state", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCommunityPlacement_productId_communityId_key" ON "MarketplaceCommunityPlacement"("productId", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePlacementEvent_correlationId_key" ON "MarketplacePlacementEvent"("correlationId");

-- CreateIndex
CREATE INDEX "MarketplacePlacementEvent_placementId_createdAt_idx" ON "MarketplacePlacementEvent"("placementId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCollection_creatorId_slug_key" ON "MarketplaceCollection"("creatorId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCollectionItem_collectionId_position_key" ON "MarketplaceCollectionItem"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTrustCase_dedupKey_key" ON "MarketplaceTrustCase"("dedupKey");

-- CreateIndex
CREATE INDEX "MarketplaceTrustCase_targetType_targetId_idx" ON "MarketplaceTrustCase"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "MarketplaceTrustCase_state_severity_createdAt_idx" ON "MarketplaceTrustCase"("state", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceTrustCase_ownerUserId_createdAt_idx" ON "MarketplaceTrustCase"("ownerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceReport_caseId_reporterUserId_key" ON "MarketplaceReport"("caseId", "reporterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceRestriction_activeKey_key" ON "MarketplaceRestriction"("activeKey");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceRestriction_decisionEventId_key" ON "MarketplaceRestriction"("decisionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceRestriction_revokedByEventId_key" ON "MarketplaceRestriction"("revokedByEventId");

-- CreateIndex
CREATE INDEX "MarketplaceRestriction_caseId_revokedAt_idx" ON "MarketplaceRestriction"("caseId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTrustEvent_correlationId_key" ON "MarketplaceTrustEvent"("correlationId");

-- CreateIndex
CREATE INDEX "MarketplaceTrustEvent_caseId_createdAt_idx" ON "MarketplaceTrustEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceAppeal_caseId_createdAt_idx" ON "MarketplaceAppeal"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceAppeal_decisionEventId_submittedByUserId_key" ON "MarketplaceAppeal"("decisionEventId", "submittedByUserId");

-- AddForeignKey
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "MarketplaceCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplaceCommunityPlacement_approvedSnapshotId_fkey" FOREIGN KEY ("approvedSnapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePlacementEvent" ADD CONSTRAINT "MarketplacePlacementEvent_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "MarketplaceCommunityPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCollection" ADD CONSTRAINT "MarketplaceCollection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "MarketplaceCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCollectionItem" ADD CONSTRAINT "MarketplaceCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "MarketplaceCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCollectionItem" ADD CONSTRAINT "MarketplaceCollectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "MarketplaceCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "MarketplaceCommunityPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "MarketplaceReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceTrustCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceRestriction" ADD CONSTRAINT "MarketplaceRestriction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceTrustCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustEvent" ADD CONSTRAINT "MarketplaceTrustEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceTrustCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTrustEvent" ADD CONSTRAINT "MarketplaceTrustEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceAppeal" ADD CONSTRAINT "MarketplaceAppeal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceTrustCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceAppeal" ADD CONSTRAINT "MarketplaceAppeal_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Normalize mutable public projections; immutable snapshots and historical releases remain evidence.
UPDATE "MarketplaceProduct" SET "platforms" = ARRAY(SELECT DISTINCT CASE lower(regexp_replace(trim(value), '[ _]+', '-', 'g')) WHEN 'vs-code' THEN 'vscode' ELSE lower(regexp_replace(trim(value), '[ _]+', '-', 'g')) END FROM unnest("platforms") value ORDER BY 1), "models" = ARRAY(SELECT DISTINCT lower(regexp_replace(trim(value), '[ _]+', '-', 'g')) FROM unnest("models") value ORDER BY 1);
UPDATE "MarketplaceCommunity" SET "primaryPlatform" = CASE lower(regexp_replace(trim("primaryPlatform"), '[ _]+', '-', 'g')) WHEN 'vs-code' THEN 'vscode' ELSE lower(regexp_replace(trim("primaryPlatform"), '[ _]+', '-', 'g')) END;
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_platform_keys" CHECK ("platforms" <@ ARRAY['claude','claude-code','chatgpt','codex','cursor','vscode','gemini','gemini-cli','api']::text[]), ADD CONSTRAINT "MarketplaceProduct_model_keys" CHECK ("models" <@ ARRAY['gpt-5','claude-4','gemini-2.5','model-agnostic']::text[]);
ALTER TABLE "MarketplaceCommunity" ADD CONSTRAINT "MarketplaceCommunity_platform_key" CHECK ("primaryPlatform" IN ('claude','claude-code','chatgpt','codex','cursor','vscode','gemini','gemini-cli','api'));
-- Ambiguous legacy types require explicit reclassification through a creator snapshot.
UPDATE "MarketplaceProduct" SET "itemType" = CASE "type" WHEN 'Integration' THEN 'INTEGRATION'::"MarketplaceItemType" WHEN 'Rule' THEN 'RULE'::"MarketplaceItemType" WHEN 'Hook' THEN 'HOOK'::"MarketplaceItemType" WHEN 'Template' THEN 'TEMPLATE'::"MarketplaceItemType" ELSE "itemType" END, "classificationRequired" = false WHERE "type" IN ('Integration','Rule','Hook','Template');
UPDATE "MarketplaceProduct" SET "type" = CASE "itemType" WHEN 'SKILL' THEN 'Skill' WHEN 'AGENT' THEN 'Agent' WHEN 'MCP_SERVER' THEN 'MCP server' WHEN 'INTEGRATION' THEN 'Integration' WHEN 'RULE' THEN 'Rule' WHEN 'PROMPT' THEN 'Prompt' WHEN 'HOOK' THEN 'Hook' WHEN 'TEMPLATE' THEN 'Template' WHEN 'WORKFLOW' THEN 'Workflow' ELSE "type" END;
CREATE TRIGGER "MarketplacePlacementEvent_append_only" BEFORE UPDATE OR DELETE ON "MarketplacePlacementEvent" FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_listing_audit_mutation();
CREATE TRIGGER "MarketplaceTrustEvent_append_only" BEFORE UPDATE OR DELETE ON "MarketplaceTrustEvent" FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_listing_audit_mutation();
CREATE TRIGGER "MarketplaceReport_append_only" BEFORE UPDATE OR DELETE ON "MarketplaceReport" FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_listing_audit_mutation();
ALTER TABLE "MarketplaceCommunityPlacement" ADD CONSTRAINT "MarketplacePlacement_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT;
ALTER TABLE "MarketplaceRestriction" ADD CONSTRAINT "MarketplaceRestriction_decisionEventId_fkey" FOREIGN KEY ("decisionEventId") REFERENCES "MarketplaceTrustEvent"("id") ON DELETE RESTRICT, ADD CONSTRAINT "MarketplaceRestriction_revokedByEventId_fkey" FOREIGN KEY ("revokedByEventId") REFERENCES "MarketplaceTrustEvent"("id") ON DELETE RESTRICT;
ALTER TABLE "MarketplaceAppeal" ADD CONSTRAINT "MarketplaceAppeal_decisionEventId_fkey" FOREIGN KEY ("decisionEventId") REFERENCES "MarketplaceTrustEvent"("id") ON DELETE RESTRICT;
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceCase_target_scope" CHECK (
 ("targetType" = 'PRODUCT' AND "productId" = "targetId" AND "productId" IS NOT NULL AND "creatorId" IS NULL AND "releaseId" IS NULL AND "placementId" IS NULL AND "reviewId" IS NULL) OR
 ("targetType" = 'CREATOR' AND "creatorId" = "targetId" AND "creatorId" IS NOT NULL AND "productId" IS NULL AND "releaseId" IS NULL AND "placementId" IS NULL AND "reviewId" IS NULL) OR
 ("targetType" = 'RELEASE' AND "releaseId" = "targetId" AND "releaseId" IS NOT NULL AND "productId" IS NULL AND "creatorId" IS NULL AND "placementId" IS NULL AND "reviewId" IS NULL) OR
 ("targetType" = 'PLACEMENT' AND "placementId" = "targetId" AND "placementId" IS NOT NULL AND "productId" IS NULL AND "creatorId" IS NULL AND "releaseId" IS NULL AND "reviewId" IS NULL) OR
 ("targetType" = 'REVIEW' AND "reviewId" = "targetId" AND "reviewId" IS NOT NULL AND "productId" IS NULL AND "creatorId" IS NULL AND "releaseId" IS NULL AND "placementId" IS NULL) OR
 ("targetType" = 'USER' AND "ownerUserId" = "targetId" AND "ownerUserId" IS NOT NULL AND "productId" IS NULL AND "creatorId" IS NULL AND "releaseId" IS NULL AND "placementId" IS NULL AND "reviewId" IS NULL));
CREATE FUNCTION enforce_marketplace_placement_snapshot() RETURNS trigger AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "MarketplaceListingSnapshot" WHERE "id" = NEW."snapshotId" AND "productId" = NEW."productId") OR (NEW."approvedSnapshotId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "MarketplaceListingSnapshot" WHERE "id" = NEW."approvedSnapshotId" AND "productId" = NEW."productId")) THEN RAISE EXCEPTION 'Placement snapshot must belong to the same listing'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "MarketplacePlacement_same_listing" BEFORE INSERT OR UPDATE ON "MarketplaceCommunityPlacement" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_placement_snapshot();
CREATE FUNCTION enforce_marketplace_restriction_history() RETURNS trigger AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Restrictions are retained'; END IF;
 IF TG_OP = 'UPDATE' AND (OLD."revokedAt" IS NOT NULL OR NEW."id" <> OLD."id" OR NEW."caseId" <> OLD."caseId" OR NEW."decisionEventId" <> OLD."decisionEventId" OR NEW."createdAt" <> OLD."createdAt" OR NEW."revokedAt" IS NULL OR NEW."revokedByEventId" IS NULL OR NEW."activeKey" IS NOT NULL) THEN RAISE EXCEPTION 'Only one-way audited restriction revocation is allowed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM "MarketplaceTrustEvent" WHERE "id" = NEW."decisionEventId" AND "caseId" = NEW."caseId" AND "action" = 'RESTRICT') OR (NEW."revokedByEventId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "MarketplaceTrustEvent" WHERE "id" = NEW."revokedByEventId" AND "caseId" = NEW."caseId" AND "action" IN ('LIFT','APPEAL_REVERSED'))) THEN RAISE EXCEPTION 'Restriction must reference decisions from its own case'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "MarketplaceRestriction_history" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceRestriction" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_restriction_history();
CREATE FUNCTION enforce_marketplace_appeal_history() RETURNS trigger AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Appeals are retained'; END IF;
 IF TG_OP = 'UPDATE' AND (OLD."outcome" <> 'PENDING' OR NEW."outcome" = 'PENDING' OR NEW."caseId" <> OLD."caseId" OR NEW."decisionEventId" <> OLD."decisionEventId" OR NEW."submittedByUserId" <> OLD."submittedByUserId" OR NEW."explanation" <> OLD."explanation" OR NEW."evidence" <> OLD."evidence" OR NEW."createdAt" <> OLD."createdAt") THEN RAISE EXCEPTION 'Appeal evidence and decisions are immutable'; END IF;
 IF NOT EXISTS (SELECT 1 FROM "MarketplaceTrustEvent" WHERE "id" = NEW."decisionEventId" AND "caseId" = NEW."caseId") THEN RAISE EXCEPTION 'Appeal must reference a decision from its own case'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "MarketplaceAppeal_history" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceAppeal" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_appeal_history();

-- Surface existing snapshot requests for explicit staff decisions; never infer approval.
INSERT INTO "MarketplaceCommunityPlacement" ("id","productId","communityId","snapshotId","state","requestedByUserId","requestedAt")
SELECT DISTINCT ON (request."productId",request."communityId") 'placement_' || md5(request."productId" || ':' || request."communityId"), request."productId",request."communityId",request."snapshotId",'REQUESTED',request."requestedByUserId",request."createdAt"
FROM "MarketplaceCommunityPlacementRequest" request JOIN "MarketplaceProduct" product ON product."id" = request."productId" JOIN "MarketplaceCommunity" community ON community."id" = request."communityId"
WHERE community."state" = 'ACTIVE' AND request."snapshotId" IN (product."proposedSnapshotId",product."approvedSnapshotId")
ORDER BY request."productId",request."communityId",request."createdAt" DESC,request."snapshotId";
INSERT INTO "MarketplacePlacementEvent" ("id","placementId","actorUserId","state","correlationId","createdAt")
SELECT 'event_' || md5("id"),"id","requestedByUserId",'REQUESTED','backfill-' || "id","requestedAt" FROM "MarketplaceCommunityPlacement";
-- Mutable unpublished releases adopt the same compatibility keys; published provenance stays immutable.
UPDATE "MarketplaceReleaseCompatibility" compatibility SET "platformKey" = CASE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g')) WHEN 'vs-code' THEN 'vscode' ELSE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g')) END, "models" = ARRAY(SELECT DISTINCT lower(regexp_replace(trim(value), '[ _]+', '-', 'g')) FROM unnest(compatibility."models") value ORDER BY 1)
WHERE EXISTS (SELECT 1 FROM "MarketplaceReleaseManifest" release WHERE release."id" = compatibility."releaseManifestId" AND release."publishedAt" IS NULL);
ALTER TABLE "MarketplaceRestriction" ADD CONSTRAINT "MarketplaceRestriction_revocation_state" CHECK (("revokedAt" IS NULL AND "revokedByEventId" IS NULL AND "activeKey" IS NOT NULL) OR ("revokedAt" IS NOT NULL AND "revokedByEventId" IS NOT NULL AND "activeKey" IS NULL));
-- Published release contents stay immutable; the source worker may refresh verification status.
CREATE OR REPLACE FUNCTION prevent_published_marketplace_release_mutation() RETURNS trigger AS $$
DECLARE release_id TEXT;
DECLARE status_fields TEXT[] := ARRAY['sourceCheckStatus','sourceCheckedAt','sourceNextCheckAt','sourceFailureCount','lastSourceErrorCode','ownershipVerifiedAt','verifiedConnectionId'];
BEGIN
 IF TG_TABLE_NAME = 'MarketplaceReleaseManifest' THEN
   release_id := OLD."id";
   IF TG_OP = 'UPDATE' AND OLD."publishedAt" IS NOT NULL THEN
     IF (to_jsonb(NEW) - status_fields) IS DISTINCT FROM (to_jsonb(OLD) - status_fields) THEN RAISE EXCEPTION 'Published marketplace release contents are immutable'; END IF;
     RETURN NEW;
   END IF;
 ELSIF TG_OP = 'DELETE' THEN release_id := OLD."releaseManifestId";
 ELSE release_id := NEW."releaseManifestId";
 END IF;
 IF EXISTS (SELECT 1 FROM "MarketplaceReleaseManifest" WHERE "id" = release_id AND "publishedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Published marketplace release manifests are immutable'; END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
