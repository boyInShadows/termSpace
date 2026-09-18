UPDATE "MarketplaceProduct"
SET "priceMinor" = 0,
    "pricingModel" = 'free'
WHERE "priceMinor" <> 0
   OR "pricingModel" <> 'free';

ALTER TABLE "MarketplaceProduct"
  ALTER COLUMN "priceMinor" SET DEFAULT 0,
  ALTER COLUMN "pricingModel" SET DEFAULT 'free';

ALTER TABLE "MarketplaceProduct"
  ADD CONSTRAINT "MarketplaceProduct_free_resource_check"
  CHECK ("priceMinor" = 0 AND "pricingModel" = 'free');
