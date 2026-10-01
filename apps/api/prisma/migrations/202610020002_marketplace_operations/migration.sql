CREATE TYPE "MarketplaceMaintenanceStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'ABANDONED');
CREATE TYPE "MarketplaceCuratedScope" AS ENUM ('STAFF', 'COMMUNITY');

ALTER TABLE "ReaderUser"
  ADD COLUMN "memberNotificationsReadAt" TIMESTAMP(3),
  ADD COLUMN "creatorNotificationsReadAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceProduct"
  ADD COLUMN "maintenanceStatus" "MarketplaceMaintenanceStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "maintenanceNote" TEXT;

CREATE TABLE "MarketplaceDailyMetric" (
  "productId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "installationViews" INTEGER NOT NULL DEFAULT 0,
  "ratingSnapshot" DECIMAL(2,1),
  "reviewCountSnapshot" INTEGER,
  CONSTRAINT "MarketplaceDailyMetric_pkey" PRIMARY KEY ("productId", "day"),
  CONSTRAINT "MarketplaceDailyMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "MarketplaceDailyMetric_day_idx" ON "MarketplaceDailyMetric"("day");

CREATE TABLE "MarketplaceCuratedCollection" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "titleFa" TEXT,
  "descriptionEn" TEXT NOT NULL,
  "descriptionFa" TEXT,
  "scope" "MarketplaceCuratedScope" NOT NULL,
  "communityId" TEXT,
  "curatorUserId" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceCuratedCollection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceCuratedCollection_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "MarketplaceCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceCuratedCollection_curatorUserId_fkey" FOREIGN KEY ("curatorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceCuratedCollection_scope_check" CHECK (("scope" = 'STAFF' AND "communityId" IS NULL) OR ("scope" = 'COMMUNITY' AND "communityId" IS NOT NULL))
);
CREATE UNIQUE INDEX "MarketplaceCuratedCollection_slug_key" ON "MarketplaceCuratedCollection"("slug");
CREATE INDEX "MarketplaceCuratedCollection_published_position_idx" ON "MarketplaceCuratedCollection"("published", "position");
CREATE INDEX "MarketplaceCuratedCollection_communityId_published_idx" ON "MarketplaceCuratedCollection"("communityId", "published");

CREATE TABLE "MarketplaceCuratedCollectionItem" (
  "collectionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "MarketplaceCuratedCollectionItem_pkey" PRIMARY KEY ("collectionId", "productId"),
  CONSTRAINT "MarketplaceCuratedCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "MarketplaceCuratedCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceCuratedCollectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MarketplaceCuratedCollectionItem_collectionId_position_key" ON "MarketplaceCuratedCollectionItem"("collectionId", "position");
