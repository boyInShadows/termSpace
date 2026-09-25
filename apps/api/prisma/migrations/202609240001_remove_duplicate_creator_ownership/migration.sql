-- The community publishing path introduced a second creator-owner relation
-- (`userId`) alongside the established, role-aware `ownerUserId` relation.
-- Refuse to discard live ownership data silently: any environment that accepted
-- community profiles must reconcile those rows before this migration can run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "MarketplaceCreator"
    WHERE "userId" IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'MarketplaceCreator.userId contains data; reconcile duplicate creator ownership into ownerUserId before applying 202609240001';
  END IF;
END $$;

ALTER TABLE "MarketplaceCreator"
  DROP CONSTRAINT "MarketplaceCreator_userId_fkey";

DROP INDEX "MarketplaceCreator_userId_key";

ALTER TABLE "MarketplaceCreator"
  DROP COLUMN "userId";
