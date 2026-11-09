-- Additive and non-destructive: an optional creator picture URL. The CHECK mirrors MARKETPLACE_ICON_HOSTS in
-- apps/api/src/lib/marketplaceManifest.ts (the same GitHub image hosts as listing icons), so a bad value cannot
-- reach a public page even if application validation is bypassed.
ALTER TABLE "MarketplaceCreator" ADD COLUMN "avatarUrl" TEXT;

ALTER TABLE "MarketplaceCreator" ADD CONSTRAINT "MarketplaceCreator_avatarUrl_host"
  CHECK ("avatarUrl" IS NULL OR "avatarUrl" ~ '^https://(avatars|raw)\.githubusercontent\.com/[^[:space:]]+$');
