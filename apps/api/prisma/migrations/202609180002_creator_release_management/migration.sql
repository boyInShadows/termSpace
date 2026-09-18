ALTER TABLE "MarketplaceOrder"
  ADD COLUMN "releaseManifestId" TEXT;

CREATE INDEX "MarketplaceOrder_releaseManifestId_createdAt_idx"
  ON "MarketplaceOrder"("releaseManifestId", "createdAt");

ALTER TABLE "MarketplaceOrder"
  ADD CONSTRAINT "MarketplaceOrder_releaseManifestId_fkey"
  FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_published_marketplace_release_identity_mutation() RETURNS trigger AS $$
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
    NEW."installationMethod" IS DISTINCT FROM OLD."installationMethod" OR
    NEW."installationInstructions" IS DISTINCT FROM OLD."installationInstructions" OR
    NEW."releaseNotes" IS DISTINCT FROM OLD."releaseNotes" OR
    NEW."publishedAt" IS DISTINCT FROM OLD."publishedAt"
  ) THEN
    RAISE EXCEPTION 'Published marketplace release identity is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceReleaseManifest_published_identity_immutable"
BEFORE UPDATE ON "MarketplaceReleaseManifest"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_identity_mutation();

CREATE FUNCTION prevent_published_marketplace_version_mutation() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "MarketplaceReleaseManifest"
    WHERE "productVersionId" = OLD."id" AND "publishedAt" IS NOT NULL
  ) AND (
    NEW."productId" IS DISTINCT FROM OLD."productId" OR
    NEW."version" IS DISTINCT FROM OLD."version" OR
    NEW."notes" IS DISTINCT FROM OLD."notes" OR
    NEW."releasedAt" IS DISTINCT FROM OLD."releasedAt"
  ) THEN
    RAISE EXCEPTION 'Published marketplace version is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceProductVersion_published_immutable"
BEFORE UPDATE ON "MarketplaceProductVersion"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_version_mutation();

CREATE FUNCTION prevent_published_marketplace_release_child_mutation() RETURNS trigger AS $$
DECLARE
  release_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    release_id := OLD."releaseManifestId";
  ELSE
    release_id := NEW."releaseManifestId";
  END IF;
  IF EXISTS (
    SELECT 1 FROM "MarketplaceReleaseManifest"
    WHERE "id" = release_id AND "publishedAt" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Published marketplace release details are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceReleaseCompatibility_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleaseCompatibility"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceReleasePermission_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleasePermission"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceReleaseEnvironmentVariable_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleaseEnvironmentVariable"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceSkillReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceSkillReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceAgentReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceAgentReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceMcpServerReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceMcpServerReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceIntegrationReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceIntegrationReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceRuleReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceRuleReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplacePromptReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplacePromptReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceHookReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceHookReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceTemplateReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceTemplateReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();
CREATE TRIGGER "MarketplaceWorkflowReleaseDetails_published_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceWorkflowReleaseDetails"
FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_child_mutation();

CREATE FUNCTION enforce_marketplace_acquisition_release() RETURNS trigger AS $$
BEGIN
  IF NEW."releaseManifestId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "MarketplaceReleaseManifest" release
    JOIN "MarketplaceProductVersion" version ON version."id" = release."productVersionId"
    WHERE release."id" = NEW."releaseManifestId"
      AND release."publishedAt" IS NOT NULL
      AND version."productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Acquisition release must be a published release of the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceOrder_release_ownership"
BEFORE INSERT OR UPDATE OF "productId", "releaseManifestId" ON "MarketplaceOrder"
FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_acquisition_release();
