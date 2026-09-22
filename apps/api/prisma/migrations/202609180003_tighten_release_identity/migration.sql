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
