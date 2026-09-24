-- AlterTable
ALTER TABLE "MarketplaceCommunity" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MarketplaceCommunityPlacement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "MarketplaceCommunityPlacementRequest_requestedByUserId_createdA" RENAME TO "MarketplaceCommunityPlacementRequest_requestedByUserId_crea_idx";

-- RenameIndex
ALTER INDEX "MarketplaceReleaseCompatibility_releaseManifestId_platformKey_k" RENAME TO "MarketplaceReleaseCompatibility_releaseManifestId_platformK_key";

-- RenameIndex
ALTER INDEX "MarketplaceReleaseEnvironmentVariable_releaseManifestId_name_ke" RENAME TO "MarketplaceReleaseEnvironmentVariable_releaseManifestId_nam_key";

-- RenameIndex
ALTER INDEX "MarketplaceReleaseManifest_sourceCheckStatus_sourceNextCheckAt_" RENAME TO "MarketplaceReleaseManifest_sourceCheckStatus_sourceNextChec_idx";
