-- Reviews belong to a reader account: one per reader per listing, with a
-- moderator's hide decision recorded on the row. Existing seeded rows keep a
-- NULL userId (Postgres lets a unique index hold many NULLs).
ALTER TABLE "MarketplaceReview"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "hiddenReason" TEXT,
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "hiddenById" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MarketplaceReview"
  ADD CONSTRAINT "MarketplaceReview_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "MarketplaceReview_hidden_not_published" CHECK ("hiddenAt" IS NULL OR "published" = false);

CREATE UNIQUE INDEX "MarketplaceReview_userId_productId_key" ON "MarketplaceReview"("userId", "productId");

ALTER TABLE "MarketplaceReview"
  ADD CONSTRAINT "MarketplaceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
