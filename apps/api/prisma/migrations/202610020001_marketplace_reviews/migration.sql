CREATE TYPE "MarketplaceReviewStatus" AS ENUM ('PUBLISHED', 'HELD', 'WITHDRAWN');
ALTER TYPE "MarketplaceTrustTarget" ADD VALUE 'RESPONSE';

ALTER TABLE "MarketplaceReview"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "bodyHash" TEXT,
  ADD COLUMN "status" "MarketplaceReviewStatus" NOT NULL DEFAULT 'HELD',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "MarketplaceReview"
SET "status" = CASE WHEN "published" THEN 'PUBLISHED'::"MarketplaceReviewStatus" ELSE 'HELD'::"MarketplaceReviewStatus" END,
    "updatedAt" = "createdAt";
ALTER TABLE "MarketplaceReview"
  ALTER COLUMN "updatedAt" SET NOT NULL,
  DROP COLUMN "published",
  DROP COLUMN "verifiedPurchase";
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "MarketplaceReview" DROP CONSTRAINT "MarketplaceReview_productId_fkey";
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MarketplaceReview_userId_productId_key" ON "MarketplaceReview"("userId", "productId");
CREATE INDEX "MarketplaceReview_productId_status_createdAt_idx" ON "MarketplaceReview"("productId", "status", "createdAt");
CREATE INDEX "MarketplaceReview_bodyHash_createdAt_idx" ON "MarketplaceReview"("bodyHash", "createdAt");

CREATE TABLE "MarketplaceReviewResponse" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "creatorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "MarketplaceReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceReviewResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplaceReviewResponse_reviewId_key" ON "MarketplaceReviewResponse"("reviewId");
ALTER TABLE "MarketplaceReviewResponse" ADD CONSTRAINT "MarketplaceReviewResponse_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "MarketplaceReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReviewResponse" ADD CONSTRAINT "MarketplaceReviewResponse_creatorUserId_fkey"
  FOREIGN KEY ("creatorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketplaceReviewAudit" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceReviewAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketplaceReviewAudit_reviewId_createdAt_idx" ON "MarketplaceReviewAudit"("reviewId", "createdAt");
ALTER TABLE "MarketplaceReviewAudit" ADD CONSTRAINT "MarketplaceReviewAudit_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "MarketplaceReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReviewAudit" ADD CONSTRAINT "MarketplaceReviewAudit_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE FUNCTION prevent_marketplace_review_audit_changes() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace review audit entries are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "MarketplaceReviewAudit_immutable" BEFORE UPDATE OR DELETE ON "MarketplaceReviewAudit"
FOR EACH ROW EXECUTE FUNCTION prevent_marketplace_review_audit_changes();

ALTER TABLE "MarketplaceTrustCase" ADD COLUMN "responseId" TEXT;
ALTER TABLE "MarketplaceTrustCase" ADD CONSTRAINT "MarketplaceTrustCase_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "MarketplaceReviewResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "MarketplaceProduct" AS product
SET "reviewCount" = totals.count,
    "rating" = totals.rating
FROM (
  SELECT product.id,
    count(review.id)::integer AS count,
    coalesce(round(avg(review.rating)::numeric, 1), 0)::decimal(2,1) AS rating
  FROM "MarketplaceProduct" AS product
  LEFT JOIN "MarketplaceReview" AS review ON review."productId" = product.id
    AND review."status" = 'PUBLISHED'
    AND NOT EXISTS (
      SELECT 1 FROM "MarketplaceTrustCase" AS trust_case
      JOIN "MarketplaceRestriction" AS restriction ON restriction."caseId" = trust_case.id
      WHERE trust_case."reviewId" = review.id AND restriction."revokedAt" IS NULL
    )
  GROUP BY product.id
) AS totals
WHERE product.id = totals.id;
