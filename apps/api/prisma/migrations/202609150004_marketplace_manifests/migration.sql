CREATE TYPE "MarketplaceItemType" AS ENUM ('SKILL', 'AGENT', 'MCP_SERVER', 'INTEGRATION', 'RULE', 'PROMPT', 'HOOK', 'TEMPLATE', 'WORKFLOW');
CREATE TYPE "MarketplaceSourceKind" AS ENUM ('GITHUB_REPOSITORY', 'GITHUB_RELEASE', 'NPM');
CREATE TYPE "MarketplaceInstallationMethod" AS ENUM ('MANUAL', 'NPM', 'GIT', 'DOWNLOAD', 'CONTAINER', 'HOSTED');
CREATE TYPE "MarketplacePermissionCapability" AS ENUM ('FILESYSTEM_READ', 'FILESYSTEM_WRITE', 'PROCESS_EXECUTION', 'NETWORK_ACCESS', 'ENVIRONMENT_ACCESS', 'SECRET_ACCESS', 'BROWSER_AUTOMATION', 'EXTERNAL_ACCOUNT_ACCESS', 'PERSISTENT_STORAGE', 'BACKGROUND_EXECUTION', 'CODE_MODIFICATION', 'TELEMETRY');

ALTER TABLE "MarketplaceProduct"
  ADD COLUMN "itemType" "MarketplaceItemType",
  ADD COLUMN "classificationRequired" BOOLEAN NOT NULL DEFAULT false;

UPDATE "MarketplaceProduct"
SET "itemType" = CASE "type"
  WHEN 'Skill' THEN 'SKILL'::"MarketplaceItemType"
  WHEN 'Agent' THEN 'AGENT'::"MarketplaceItemType"
  WHEN 'Workflow' THEN 'WORKFLOW'::"MarketplaceItemType"
  WHEN 'Prompt' THEN 'PROMPT'::"MarketplaceItemType"
  WHEN 'Prompt pack' THEN 'PROMPT'::"MarketplaceItemType"
  WHEN 'MCP server' THEN 'MCP_SERVER'::"MarketplaceItemType"
  ELSE NULL
END,
"classificationRequired" = CASE
  WHEN "type" IN ('Skill', 'Agent', 'Workflow', 'Prompt', 'Prompt pack', 'MCP server') THEN false
  ELSE true
END;

ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_classification_state_check"
CHECK (("itemType" IS NOT NULL AND "classificationRequired" = false) OR ("itemType" IS NULL AND "classificationRequired" = true));

CREATE INDEX "MarketplaceProduct_published_itemType_idx" ON "MarketplaceProduct"("published", "itemType");
CREATE INDEX "MarketplaceProduct_classificationRequired_idx" ON "MarketplaceProduct"("classificationRequired");

CREATE TABLE "MarketplaceManifestSnapshot" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "manifestVersion" INTEGER NOT NULL,
  "itemType" "MarketplaceItemType" NOT NULL,
  "digestSha256" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceManifestSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceReleaseManifest" (
  "id" TEXT NOT NULL,
  "productVersionId" TEXT NOT NULL,
  "manifestVersion" INTEGER NOT NULL,
  "itemType" "MarketplaceItemType" NOT NULL,
  "sourceKind" "MarketplaceSourceKind" NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceRef" TEXT NOT NULL,
  "sourcePath" TEXT,
  "providerIntegrityDigest" TEXT,
  "sourceResolvedAt" TIMESTAMP(3),
  "ownershipVerifiedAt" TIMESTAMP(3),
  "installationMethod" "MarketplaceInstallationMethod" NOT NULL,
  "installationInstructions" TEXT[] NOT NULL,
  "runtimeRequirements" TEXT[] NOT NULL,
  "accountRequirements" TEXT[] NOT NULL,
  "operatingSystems" TEXT[] NOT NULL,
  "dependencyRequirements" TEXT[] NOT NULL,
  "licenseIdentifier" TEXT,
  "customLicenseUrl" TEXT,
  "documentationUrl" TEXT,
  "supportUrl" TEXT,
  "releaseNotes" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceReleaseManifest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceReleaseManifest_license_check" CHECK (("licenseIdentifier" IS NOT NULL) <> ("customLicenseUrl" IS NOT NULL))
);

CREATE TABLE "MarketplaceReleaseCompatibility" (
  "id" TEXT NOT NULL, "releaseManifestId" TEXT NOT NULL, "platformKey" TEXT NOT NULL,
  "models" TEXT[] NOT NULL, "notes" TEXT,
  CONSTRAINT "MarketplaceReleaseCompatibility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceReleasePermission" (
  "id" TEXT NOT NULL, "releaseManifestId" TEXT NOT NULL,
  "capability" "MarketplacePermissionCapability" NOT NULL, "required" BOOLEAN NOT NULL DEFAULT true,
  "scope" TEXT, "destinations" TEXT[] NOT NULL, "purpose" TEXT NOT NULL,
  CONSTRAINT "MarketplaceReleasePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceReleaseEnvironmentVariable" (
  "id" TEXT NOT NULL, "releaseManifestId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, "required" BOOLEAN NOT NULL DEFAULT true, "sensitive" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MarketplaceReleaseEnvironmentVariable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceSkillReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "format" TEXT NOT NULL, "entryPath" TEXT NOT NULL,
  "activation" TEXT NOT NULL, "bundledExecutables" BOOLEAN NOT NULL, "inputs" TEXT[] NOT NULL, "outputs" TEXT[] NOT NULL,
  CONSTRAINT "MarketplaceSkillReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceAgentReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "scope" TEXT NOT NULL, "entryPath" TEXT NOT NULL, "invocation" TEXT NOT NULL,
  "tools" TEXT[] NOT NULL, "capabilities" TEXT[] NOT NULL, "modelRequirements" TEXT[] NOT NULL,
  "inputs" TEXT[] NOT NULL, "outputs" TEXT[] NOT NULL,
  CONSTRAINT "MarketplaceAgentReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceMcpServerReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "transport" TEXT NOT NULL, "connectionMethod" TEXT NOT NULL,
  "distributionIdentity" TEXT NOT NULL, "exposedTools" TEXT[] NOT NULL, "exposedResources" TEXT[] NOT NULL,
  "exposedPrompts" TEXT[] NOT NULL, "authenticationMethod" TEXT NOT NULL, "networkDestinations" TEXT[] NOT NULL,
  "dataHandling" TEXT NOT NULL, CONSTRAINT "MarketplaceMcpServerReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceIntegrationReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "integrationKind" TEXT NOT NULL, "hostPlatform" TEXT NOT NULL,
  "installationIdentifier" TEXT NOT NULL, "connectedService" TEXT NOT NULL, "requestedScopes" TEXT[] NOT NULL,
  "authentication" TEXT NOT NULL, "callback" TEXT, "dataFlow" TEXT NOT NULL,
  CONSTRAINT "MarketplaceIntegrationReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceRuleReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "format" TEXT NOT NULL, "destinationScope" TEXT NOT NULL,
  "entryPath" TEXT NOT NULL, "activation" TEXT NOT NULL, "applicablePaths" TEXT[] NOT NULL, "expectedEffect" TEXT NOT NULL,
  CONSTRAINT "MarketplaceRuleReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplacePromptReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "format" TEXT NOT NULL, "entryPaths" TEXT[] NOT NULL,
  "variables" TEXT[] NOT NULL, "requiredInputs" TEXT[] NOT NULL, "outputContract" TEXT NOT NULL, "intendedModels" TEXT[] NOT NULL,
  CONSTRAINT "MarketplacePromptReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceHookReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "events" TEXT[] NOT NULL, "hostPlatform" TEXT NOT NULL,
  "entryPaths" TEXT[] NOT NULL, "runtime" TEXT NOT NULL, "behavior" TEXT NOT NULL, "failurePolicy" TEXT NOT NULL,
  "effects" "MarketplacePermissionCapability"[] NOT NULL,
  CONSTRAINT "MarketplaceHookReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceTemplateReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "templateKind" TEXT NOT NULL, "includedPaths" TEXT[] NOT NULL,
  "outputFormat" TEXT NOT NULL, "initializationMethod" TEXT NOT NULL, "replacementVariables" TEXT[] NOT NULL,
  "executesScripts" BOOLEAN NOT NULL, CONSTRAINT "MarketplaceTemplateReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE TABLE "MarketplaceWorkflowReleaseDetails" (
  "releaseManifestId" TEXT NOT NULL, "stages" JSONB NOT NULL, "dependencies" TEXT[] NOT NULL,
  "executionMethod" TEXT NOT NULL, "initialInputs" TEXT[] NOT NULL, "intermediateState" TEXT NOT NULL,
  "finalOutputs" TEXT[] NOT NULL, "retryBehavior" TEXT NOT NULL, "rollbackBehavior" TEXT NOT NULL,
  "partialFailureBehavior" TEXT NOT NULL, CONSTRAINT "MarketplaceWorkflowReleaseDetails_pkey" PRIMARY KEY ("releaseManifestId")
);

CREATE UNIQUE INDEX "MarketplaceManifestSnapshot_productId_digestSha256_key" ON "MarketplaceManifestSnapshot"("productId", "digestSha256");
CREATE INDEX "MarketplaceManifestSnapshot_productId_createdAt_idx" ON "MarketplaceManifestSnapshot"("productId", "createdAt");
CREATE UNIQUE INDEX "MarketplaceReleaseManifest_productVersionId_key" ON "MarketplaceReleaseManifest"("productVersionId");
CREATE INDEX "MarketplaceReleaseManifest_itemType_publishedAt_idx" ON "MarketplaceReleaseManifest"("itemType", "publishedAt");
CREATE INDEX "MarketplaceReleaseManifest_sourceKind_sourceUrl_idx" ON "MarketplaceReleaseManifest"("sourceKind", "sourceUrl");
CREATE UNIQUE INDEX "MarketplaceReleaseCompatibility_releaseManifestId_platformKey_key" ON "MarketplaceReleaseCompatibility"("releaseManifestId", "platformKey");
CREATE UNIQUE INDEX "MarketplaceReleasePermission_releaseManifestId_capability_key" ON "MarketplaceReleasePermission"("releaseManifestId", "capability");
CREATE UNIQUE INDEX "MarketplaceReleaseEnvironmentVariable_releaseManifestId_name_key" ON "MarketplaceReleaseEnvironmentVariable"("releaseManifestId", "name");

ALTER TABLE "MarketplaceManifestSnapshot" ADD CONSTRAINT "MarketplaceManifestSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReleaseManifest" ADD CONSTRAINT "MarketplaceReleaseManifest_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "MarketplaceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReleaseCompatibility" ADD CONSTRAINT "MarketplaceReleaseCompatibility_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReleasePermission" ADD CONSTRAINT "MarketplaceReleasePermission_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReleaseEnvironmentVariable" ADD CONSTRAINT "MarketplaceReleaseEnvironmentVariable_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceSkillReleaseDetails" ADD CONSTRAINT "MarketplaceSkillReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceAgentReleaseDetails" ADD CONSTRAINT "MarketplaceAgentReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceMcpServerReleaseDetails" ADD CONSTRAINT "MarketplaceMcpServerReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceIntegrationReleaseDetails" ADD CONSTRAINT "MarketplaceIntegrationReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceRuleReleaseDetails" ADD CONSTRAINT "MarketplaceRuleReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplacePromptReleaseDetails" ADD CONSTRAINT "MarketplacePromptReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceHookReleaseDetails" ADD CONSTRAINT "MarketplaceHookReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceTemplateReleaseDetails" ADD CONSTRAINT "MarketplaceTemplateReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceWorkflowReleaseDetails" ADD CONSTRAINT "MarketplaceWorkflowReleaseDetails_releaseManifestId_fkey" FOREIGN KEY ("releaseManifestId") REFERENCES "MarketplaceReleaseManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION prevent_marketplace_snapshot_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace manifest snapshots are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceManifestSnapshot_immutable"
BEFORE UPDATE OR DELETE ON "MarketplaceManifestSnapshot"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_snapshot_mutation();

CREATE FUNCTION prevent_published_marketplace_release_mutation() RETURNS trigger AS $$
DECLARE release_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'MarketplaceReleaseManifest' THEN
    release_id := OLD."id";
  ELSIF TG_OP = 'DELETE' THEN
    release_id := OLD."releaseManifestId";
  ELSE
    release_id := NEW."releaseManifestId";
  END IF;
  IF EXISTS (SELECT 1 FROM "MarketplaceReleaseManifest" WHERE "id" = release_id AND "publishedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Published marketplace release manifests are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceReleaseManifest_immutable_when_published" BEFORE UPDATE OR DELETE ON "MarketplaceReleaseManifest" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceReleaseCompatibility_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleaseCompatibility" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceReleasePermission_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleasePermission" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceReleaseEnvironmentVariable_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceReleaseEnvironmentVariable" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceSkillReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceSkillReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceAgentReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceAgentReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceMcpServerReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceMcpServerReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceIntegrationReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceIntegrationReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceRuleReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceRuleReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplacePromptReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplacePromptReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceHookReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceHookReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceTemplateReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceTemplateReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();
CREATE TRIGGER "MarketplaceWorkflowReleaseDetails_immutable_when_published" BEFORE INSERT OR UPDATE OR DELETE ON "MarketplaceWorkflowReleaseDetails" FOR EACH ROW EXECUTE FUNCTION prevent_published_marketplace_release_mutation();

CREATE FUNCTION enforce_marketplace_release_detail_type() RETURNS trigger AS $$
DECLARE expected_type "MarketplaceItemType";
DECLARE actual_type "MarketplaceItemType";
BEGIN
  expected_type := CASE TG_TABLE_NAME
    WHEN 'MarketplaceSkillReleaseDetails' THEN 'SKILL'::"MarketplaceItemType"
    WHEN 'MarketplaceAgentReleaseDetails' THEN 'AGENT'::"MarketplaceItemType"
    WHEN 'MarketplaceMcpServerReleaseDetails' THEN 'MCP_SERVER'::"MarketplaceItemType"
    WHEN 'MarketplaceIntegrationReleaseDetails' THEN 'INTEGRATION'::"MarketplaceItemType"
    WHEN 'MarketplaceRuleReleaseDetails' THEN 'RULE'::"MarketplaceItemType"
    WHEN 'MarketplacePromptReleaseDetails' THEN 'PROMPT'::"MarketplaceItemType"
    WHEN 'MarketplaceHookReleaseDetails' THEN 'HOOK'::"MarketplaceItemType"
    WHEN 'MarketplaceTemplateReleaseDetails' THEN 'TEMPLATE'::"MarketplaceItemType"
    WHEN 'MarketplaceWorkflowReleaseDetails' THEN 'WORKFLOW'::"MarketplaceItemType"
  END;
  SELECT "itemType" INTO actual_type FROM "MarketplaceReleaseManifest" WHERE "id" = NEW."releaseManifestId";
  IF actual_type IS DISTINCT FROM expected_type THEN
    RAISE EXCEPTION 'Release detail type does not match release manifest type';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MarketplaceSkillReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceSkillReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceAgentReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceAgentReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceMcpServerReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceMcpServerReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceIntegrationReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceIntegrationReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceRuleReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceRuleReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplacePromptReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplacePromptReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceHookReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceHookReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceTemplateReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceTemplateReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();
CREATE TRIGGER "MarketplaceWorkflowReleaseDetails_type_matches" BEFORE INSERT OR UPDATE ON "MarketplaceWorkflowReleaseDetails" FOR EACH ROW EXECUTE FUNCTION enforce_marketplace_release_detail_type();

CREATE FUNCTION require_complete_marketplace_release_before_publish() RETURNS trigger AS $$
DECLARE detail_count INTEGER;
DECLARE matching_detail_exists BOOLEAN;
BEGIN
  IF NEW."publishedAt" IS NULL OR OLD."publishedAt" IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW."sourceResolvedAt" IS NULL OR NEW."ownershipVerifiedAt" IS NULL THEN
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

CREATE TRIGGER "MarketplaceReleaseManifest_require_complete_publish"
BEFORE UPDATE OF "publishedAt" ON "MarketplaceReleaseManifest"
FOR EACH ROW EXECUTE FUNCTION require_complete_marketplace_release_before_publish();
