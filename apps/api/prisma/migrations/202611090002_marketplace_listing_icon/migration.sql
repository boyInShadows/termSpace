-- Additive and non-destructive: an optional icon URL projected from the listing manifest at publish time.
-- The CHECK mirrors MARKETPLACE_ICON_HOSTS in apps/api/src/lib/marketplaceManifest.ts, so a bad value cannot
-- reach a public page even if application validation is bypassed.
ALTER TABLE "MarketplaceProduct" ADD COLUMN "iconUrl" TEXT;

ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_iconUrl_host"
  CHECK ("iconUrl" IS NULL OR "iconUrl" ~ '^https://(avatars|raw)\.githubusercontent\.com/[^[:space:]]+$');
