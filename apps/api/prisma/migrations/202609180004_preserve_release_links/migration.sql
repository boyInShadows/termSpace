CREATE OR REPLACE FUNCTION prevent_published_marketplace_release_child_mutation() RETURNS trigger AS $$
BEGIN
  IF (
    TG_OP = 'DELETE' AND EXISTS (
      SELECT 1 FROM "MarketplaceReleaseManifest"
      WHERE "id" = OLD."releaseManifestId" AND "publishedAt" IS NOT NULL
    )
  ) OR (
    TG_OP = 'INSERT' AND EXISTS (
      SELECT 1 FROM "MarketplaceReleaseManifest"
      WHERE "id" = NEW."releaseManifestId" AND "publishedAt" IS NOT NULL
    )
  ) OR (
    TG_OP = 'UPDATE' AND EXISTS (
      SELECT 1 FROM "MarketplaceReleaseManifest"
      WHERE "id" IN (OLD."releaseManifestId", NEW."releaseManifestId")
        AND "publishedAt" IS NOT NULL
    )
  ) THEN
    RAISE EXCEPTION 'Published marketplace release details are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
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
      AND version."productId" = NEW."productId"
  ) THEN
    RAISE EXCEPTION 'Acquisition release must be a published release of the same listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
