ALTER TYPE "MarketplaceListingLifecycleAction" ADD VALUE 'INTERNAL_NOTE_ADDED' AFTER 'DRAFT_SAVED';

ALTER TABLE "MarketplaceListingLifecycleEvent" ADD COLUMN "internalNote" TEXT;

ALTER TABLE "MarketplaceListingLifecycleEvent"
ADD CONSTRAINT "MarketplaceListingLifecycleEvent_internal_note_check" CHECK (
  ("internalNote" IS NULL OR length(btrim("internalNote")) BETWEEN 2 AND 4000)
  AND
  ("action" <> 'INTERNAL_NOTE_ADDED' OR "internalNote" IS NOT NULL)
);
