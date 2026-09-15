ALTER TABLE "MarketplaceCreator" ADD COLUMN "ownerUserId" TEXT;

CREATE UNIQUE INDEX "MarketplaceCreator_ownerUserId_key" ON "MarketplaceCreator"("ownerUserId");

ALTER TABLE "MarketplaceCreator" ADD CONSTRAINT "MarketplaceCreator_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
