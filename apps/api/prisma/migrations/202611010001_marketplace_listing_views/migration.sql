-- Daily per-listing view totals. No visitor identifiers are stored.
CREATE TABLE "MarketplaceListingViewDaily" (
    "productId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketplaceListingViewDaily_pkey" PRIMARY KEY ("productId","day")
);

CREATE INDEX "MarketplaceListingViewDaily_day_idx" ON "MarketplaceListingViewDaily"("day");

ALTER TABLE "MarketplaceListingViewDaily" ADD CONSTRAINT "MarketplaceListingViewDaily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
