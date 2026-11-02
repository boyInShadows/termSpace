-- Plain-link listings: no provider token and no ownership proof.
ALTER TYPE "MarketplaceSourceKind" ADD VALUE IF NOT EXISTS 'EXTERNAL_LINK';
ALTER TYPE "MarketplaceSourceCheckStatus" ADD VALUE IF NOT EXISTS 'LINK_ONLY';
ALTER TABLE "MarketplaceReleaseManifest" ADD COLUMN "sourceOriginalAuthor" TEXT;

-- Acquisitions must accept published link releases too.
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
      AND release."sourceCheckStatus" ::text IN ('VERIFIED', 'STALE', 'LINK_ONLY')
      AND version."productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Acquisition release must be an available published release of the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Publication still demands ownership proof, except for plain links.
CREATE OR REPLACE FUNCTION require_complete_marketplace_release_before_publish() RETURNS trigger AS $$
DECLARE detail_count INTEGER;
DECLARE matching_detail_exists BOOLEAN;
BEGIN
  IF NEW."publishedAt" IS NULL OR OLD."publishedAt" IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW."sourceResolvedAt" IS NULL OR (NEW."ownershipVerifiedAt" IS NULL AND NEW."sourceKind"::text <> 'EXTERNAL_LINK') THEN
    RAISE EXCEPTION 'Source resolution and ownership verification are required before publication';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "MarketplaceReleaseCompatibility" WHERE "releaseManifestId" = NEW."id") THEN
    RAISE EXCEPTION 'At least one compatibility declaration is required before publication';
  END IF;

  SELECT
    (SELECT count(*) FROM "MarketplaceSkillReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceAgentReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceMcpServerReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceIntegrationReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceRuleReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplacePromptReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceHookReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceTemplateReleaseDetails" WHERE "releaseManifestId" = NEW."id") +
    (SELECT count(*) FROM "MarketplaceWorkflowReleaseDetails" WHERE "releaseManifestId" = NEW."id")
  INTO detail_count;

  matching_detail_exists := CASE NEW."itemType"
    WHEN 'SKILL' THEN EXISTS (SELECT 1 FROM "MarketplaceSkillReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'AGENT' THEN EXISTS (SELECT 1 FROM "MarketplaceAgentReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'MCP_SERVER' THEN EXISTS (SELECT 1 FROM "MarketplaceMcpServerReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'INTEGRATION' THEN EXISTS (SELECT 1 FROM "MarketplaceIntegrationReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'RULE' THEN EXISTS (SELECT 1 FROM "MarketplaceRuleReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'PROMPT' THEN EXISTS (SELECT 1 FROM "MarketplacePromptReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'HOOK' THEN EXISTS (SELECT 1 FROM "MarketplaceHookReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'TEMPLATE' THEN EXISTS (SELECT 1 FROM "MarketplaceTemplateReleaseDetails" WHERE "releaseManifestId" = NEW."id")
    WHEN 'WORKFLOW' THEN EXISTS (SELECT 1 FROM "MarketplaceWorkflowReleaseDetails" WHERE "releaseManifestId" = NEW."id")
  END;
  IF detail_count <> 1 OR NOT matching_detail_exists THEN
    RAISE EXCEPTION 'Exactly one matching type-detail record is required before publication';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
