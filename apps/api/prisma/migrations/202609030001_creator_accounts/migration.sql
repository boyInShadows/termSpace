-- Link a marketplace creator profile to the reader account that owns it, so a
-- signed-in community member can publish under their own handle.
--
-- Nullable: the editorial creators seeded by the team are owned by nobody.
-- ON DELETE SET NULL: closing an account must not delete listings other people
-- depend on. The profile survives, unowned, and its products stay published.
ALTER TABLE "MarketplaceCreator" ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "MarketplaceCreator_userId_key" ON "MarketplaceCreator"("userId");

ALTER TABLE "MarketplaceCreator"
  ADD CONSTRAINT "MarketplaceCreator_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
