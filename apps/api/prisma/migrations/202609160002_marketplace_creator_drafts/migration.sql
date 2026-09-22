DROP INDEX "MarketplaceListingSnapshot_manifestSnapshotId_key";
DROP INDEX "MarketplaceListingSnapshot_releaseManifestId_key";
DROP INDEX "MarketplaceManifestSnapshot_productId_digestSha256_key";
DROP INDEX "MarketplaceReleaseManifest_productVersionId_key";

ALTER TABLE "MarketplaceReleaseManifest" ADD COLUMN "revision" INTEGER;

WITH numbered AS (
  SELECT "id", row_number() OVER (PARTITION BY "productVersionId" ORDER BY "createdAt", "id") AS revision
  FROM "MarketplaceReleaseManifest"
)
UPDATE "MarketplaceReleaseManifest" release
SET "revision" = numbered.revision
FROM numbered
WHERE release."id" = numbered."id";

ALTER TABLE "MarketplaceReleaseManifest" ALTER COLUMN "revision" SET NOT NULL;

CREATE INDEX "MarketplaceListingSnapshot_manifestSnapshotId_idx" ON "MarketplaceListingSnapshot"("manifestSnapshotId");
CREATE INDEX "MarketplaceListingSnapshot_releaseManifestId_idx" ON "MarketplaceListingSnapshot"("releaseManifestId");
CREATE INDEX "MarketplaceManifestSnapshot_productId_digestSha256_idx" ON "MarketplaceManifestSnapshot"("productId", "digestSha256");
CREATE UNIQUE INDEX "MarketplaceReleaseManifest_productVersionId_revision_key" ON "MarketplaceReleaseManifest"("productVersionId", "revision");

CREATE TYPE "MarketplaceCommunityState" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "MarketplaceCommunity" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameFa" TEXT,
  "descriptionEn" TEXT NOT NULL,
  "descriptionFa" TEXT,
  "primaryPlatform" TEXT NOT NULL,
  "rulesEn" TEXT NOT NULL,
  "rulesFa" TEXT,
  "submissionGuidanceEn" TEXT NOT NULL,
  "submissionGuidanceFa" TEXT,
  "state" "MarketplaceCommunityState" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceCommunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceCommunityPlacementRequest" (
  "snapshotId" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceCommunityPlacementRequest_pkey" PRIMARY KEY ("snapshotId", "communityId")
);

CREATE UNIQUE INDEX "MarketplaceCommunity_slug_key" ON "MarketplaceCommunity"("slug");
CREATE INDEX "MarketplaceCommunity_state_nameEn_idx" ON "MarketplaceCommunity"("state", "nameEn");
CREATE INDEX "MarketplaceCommunity_primaryPlatform_state_idx" ON "MarketplaceCommunity"("primaryPlatform", "state");
CREATE INDEX "MarketplaceCommunityPlacementRequest_productId_createdAt_idx" ON "MarketplaceCommunityPlacementRequest"("productId", "createdAt");
CREATE INDEX "MarketplaceCommunityPlacementRequest_communityId_createdAt_idx" ON "MarketplaceCommunityPlacementRequest"("communityId", "createdAt");
CREATE INDEX "MarketplaceCommunityPlacementRequest_requestedByUserId_createdAt_idx" ON "MarketplaceCommunityPlacementRequest"("requestedByUserId", "createdAt");

ALTER TABLE "MarketplaceCommunityPlacementRequest" ADD CONSTRAINT "MarketplaceCommunityPlacementRequest_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketplaceListingSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementRequest" ADD CONSTRAINT "MarketplaceCommunityPlacementRequest_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "MarketplaceCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementRequest" ADD CONSTRAINT "MarketplaceCommunityPlacementRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCommunityPlacementRequest" ADD CONSTRAINT "MarketplaceCommunityPlacementRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "MarketplaceCommunity" (
  "id", "slug", "nameEn", "nameFa", "descriptionEn", "primaryPlatform", "rulesEn", "submissionGuidanceEn"
) VALUES
  ('community_codex', 'codex', 'Codex', 'کودکس', 'Skills, agents, rules, hooks, and workflows built for Codex.', 'codex', 'Listings must accurately declare installation, permissions, and supported Codex behavior.', 'Explain where the item is installed and which Codex surfaces it uses.'),
  ('community_cursor', 'cursor', 'Cursor', 'کرسر', 'Agentic coding tools and reusable workflows for Cursor.', 'cursor', 'Listings must identify supported Cursor features and avoid unsupported compatibility claims.', 'Describe installation, project scope, and any required Cursor settings.'),
  ('community_claude_code', 'claude-code', 'Claude Code', 'کلود کد', 'Tools, agents, hooks, and instructions designed for Claude Code.', 'claude-code', 'Listings must disclose hooks, commands, network access, and file-system effects.', 'Document the expected Claude Code installation path and activation behavior.'),
  ('community_vscode', 'vscode', 'VS Code', 'ویژوال استودیو کد', 'Agentic development extensions and integrations for VS Code.', 'vscode', 'Listings must distinguish editor extensions from external services and disclose requested access.', 'Identify the extension or integration boundary and required accounts.'),
  ('community_chatgpt', 'chatgpt', 'ChatGPT', 'چت‌جی‌پی‌تی', 'Reusable prompts, integrations, and agentic workflows for ChatGPT.', 'chatgpt', 'Listings must accurately describe supported ChatGPT capabilities and external dependencies.', 'Explain setup, required plans or accounts, and data sent to connected services.'),
  ('community_gemini_cli', 'gemini-cli', 'Gemini CLI', 'رابط خط فرمان جمینای', 'Agentic coding tools and workflows for Gemini CLI.', 'gemini-cli', 'Listings must disclose commands, permissions, and compatibility assumptions.', 'Describe installation, activation, and supported Gemini CLI versions.');

CREATE FUNCTION prevent_marketplace_community_request_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace community placement requests are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceCommunityPlacementRequest_append_only"
BEFORE UPDATE OR DELETE ON "MarketplaceCommunityPlacementRequest"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_community_request_mutation();

CREATE FUNCTION enforce_marketplace_community_request_ownership() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "MarketplaceListingSnapshot"
    WHERE "id" = NEW."snapshotId" AND "productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Community request snapshot must belong to the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceCommunityPlacementRequest_listing_ownership"
BEFORE INSERT ON "MarketplaceCommunityPlacementRequest"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_community_request_ownership();
