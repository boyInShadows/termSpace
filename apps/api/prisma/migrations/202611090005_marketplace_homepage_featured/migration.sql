-- Additive and non-destructive. Staff can feature a published listing on the homepage; each change is an audit
-- event, and featuredAt orders the shelf (most recently featured first). `featured` itself already exists.
ALTER TYPE "MarketplaceListingLifecycleAction" ADD VALUE 'FEATURED';
ALTER TYPE "MarketplaceListingLifecycleAction" ADD VALUE 'UNFEATURED';

ALTER TABLE "MarketplaceProduct" ADD COLUMN "featuredAt" TIMESTAMP(3);
-- Anything already featured keeps showing; it simply has no timestamp yet.
