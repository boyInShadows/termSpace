export type ProductType = "Prompt" | "Prompt pack" | "Skill" | "Agent" | "Workflow" | "MCP server" | "Integration" | "Rule" | "Hook" | "Template" | "AI tool" | "Developer utility";
export type MarketplaceItemTypeKey = "skill" | "agent" | "mcp_server" | "integration" | "rule" | "prompt" | "hook" | "template" | "workflow";
export interface MarketplaceItemType { key: MarketplaceItemTypeKey; en: string; fa: string; definition: string; }
export type Platform = "ChatGPT" | "Claude" | "Codex" | "Cursor" | "VS Code" | "Gemini" | "API";
export type AIModel = "GPT-5" | "Claude 4" | "Gemini 2.5" | "Model agnostic";
export interface Creator { id: string; name: string; handle: string; initials: string; verified: boolean; bio: string; products: number; followers: number; }
export interface OwnedCreatorProfile extends Creator { createdAt: string; updatedAt: string; accessActive: boolean; }
export interface CreatorDashboardEvent {
  id: string; action: string; state: string; message: string | null; createdAt: string;
}
export interface CreatorModerationFeedback {
  action: string; reasonCode: string; message: string | null; createdAt: string;
}
export interface CreatorDashboardListing {
  id: string; slug: string; name: string; type: ProductType; typeKey: MarketplaceItemTypeKey | null;
  state: string; lifecycleVersion: number; published: boolean; rating: number; reviewCount: number;
  acquisitionCount: number; currentVersion: string; releaseCount: number;
  latestRelease: { version: string; releasedAt: string } | null;
  moderationFeedback: CreatorModerationFeedback | null; recentUpdates: CreatorDashboardEvent[]; updatedAt: string;
}
export interface CreatorDashboard {
  summary: { totalListings: number; publishedListings: number; inReviewListings: number; totalAcquisitions: number };
  listings: CreatorDashboardListing[];
}
export interface CreatorDashboardResult {
  data: CreatorDashboard;
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface MarketplaceDraftOptions {
  categories: Array<{ slug: string; name: string }>;
  communities: Array<{
    slug: string; nameEn: string; nameFa: string | null; descriptionEn: string; descriptionFa: string | null;
    primaryPlatform: string; rulesEn: string; rulesFa: string | null; submissionGuidanceEn: string; submissionGuidanceFa: string | null;
  }>;
}
export interface MarketplaceDraftRecord {
  id: string; slug: string; name: string; state: string; version: number; published: boolean;
  draft: { revision: number; content: Record<string, unknown>; savedAt: string } | null;
}
export interface CreatorReleaseRecord {
  id: string; productVersionId: string; version: string; notes: string; revision: number;
  status: "published" | "proposed" | "superseded_draft";
  source: { kind: string; url: string; ref: string; path: string | null; integrityDigest: string | null; artifactSizeBytes: number | null; installationUrl: string | null };
  sourceCheckStatus: "pending" | "verified" | "stale" | "restricted" | "failed";
  sourceCheckedAt: string | null; sourceNextCheckAt: string | null; sourceFailureCount: number; lastSourceErrorCode: string | null;
  sourceResolvedAt: string | null; ownershipVerifiedAt: string | null; publishedAt: string | null;
  createdAt: string; listingRevision: number | null; isCurrent: boolean; acquisitionCount: number;
}
export interface MarketplaceProviderConnection {
  id: string; provider: "github" | "npm"; accountLogin: string; lastVerifiedAt: string;
  revokedAt: string | null; createdAt: string; updatedAt: string;
}
export interface CreatorReleaseHistory {
  listing: { id: string; slug: string; name: string; state: string; lifecycleVersion: number; published: boolean };
  releases: CreatorReleaseRecord[];
}
export interface MarketplaceModerationQueueListing {
  id: string; slug: string; name: string; type: ProductType; typeKey: MarketplaceItemTypeKey | null;
  state: string; version: number; published: boolean; creator: { name: string; handle: string }; selfOwned: boolean;
  proposedRevision: number | null; releaseVersion: string | null; sourceResolved: boolean; ownershipVerified: boolean;
  communityRequestCount: number; updatedAt: string;
}
export interface MarketplaceModerationQueueResult {
  data: {
    summary: { submitted: number; approved: number; awaitingAction: number };
    listings: MarketplaceModerationQueueListing[];
  };
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface MarketplaceModerationAuditEvent {
  id: string; previousState: string | null; resultingState: string; action: string; actorType: string;
  actorUserId: string | null; reasonCode: string; publicReason: string | null; internalNote: string | null;
  correlationId: string; createdAt: string;
}
export interface MarketplaceModerationPreview {
  id: string; slug: string; name: string; type: ProductType; typeKey: MarketplaceItemTypeKey | null;
  state: string; version: number; published: boolean; updatedAt: string; selfOwned: boolean;
  creator: { id: string; name: string; handle: string };
  proposedSnapshot: null | {
    id: string; revision: number; schemaVersion: number; digestSha256: string; content: Record<string, unknown>; createdAt: string;
    releaseManifest: null | {
      id: string; sourceKind: string; sourceUrl: string; sourceRef: string; sourcePath: string | null;
      providerIntegrityDigest: string | null; sourceResolvedAt: string | null; ownershipVerifiedAt: string | null;
      sourceCheckStatus: string; sourceCheckedAt: string | null; lastSourceErrorCode: string | null; publishedAt: string | null;
    };
    communityRequests: Array<{ createdAt: string; community: { slug: string; nameEn: string; nameFa: string | null; primaryPlatform: string; rulesEn: string; rulesFa: string | null } }>;
  };
  approvedSnapshot: null | { id: string; revision: number; content: Record<string, unknown>; createdAt: string };
  auditTrail: MarketplaceModerationAuditEvent[];
  auditTrailTruncated: boolean;
}
export interface Pricing { amountMinor: number; currency: "USD"; model: "one-time" | "free"; }
export interface Compatibility { platforms: Platform[]; models: AIModel[]; }
export interface ProductVersion { id: string; version: string; releasedAt: string; notes: string; }
export interface Review { id: string; author: string; rating: number; createdAt: string; body: string; verifiedPurchase: boolean; }
export interface Product {
  id: string; slug: string; name: string; type: ProductType; typeKey: MarketplaceItemTypeKey | null; outcome: string; description: string;
  creator: Creator; pricing: Pricing; compatibility: Compatibility; category: string; rating: number;
  reviewCount: number; usageCount: number; purchaseCount: number; updatedAt: string; version: string;
  featured?: boolean; trending?: boolean; verified: boolean; tags: string[];
}
export interface ProductDetail extends Product {
  packageFileCount: number | null; packageSizeBytes: number | null; benefits: string[];
  useCases: { title: string; description: string }[] | null;
  includedFiles: { name: string; description: string }[] | null;
  exampleInput: string | null; exampleOutputTitle: string | null; exampleOutputBody: string | null;
  previewFiles: string[]; previewExcerpt: string | null;
  requirements: string | null; permissions: string | null; license: string | null;
  updatesPolicy: string | null; refundPolicy: string | null;
  versions: ProductVersion[]; reviews: Review[]; related: Product[];
}
export interface MarketplaceInstallation {
  acquisition: { id: string; status: string; acquiredAt: string };
  product: { slug: string; name: string };
  release: {
    id: string; version: string;
    source: {
      kind: string; url: string; ref: string; path: string | null; integrityDigest: string | null;
      artifactSizeBytes: number | null; status: "verified" | "stale"; checkedAt: string | null;
    };
    installation: { method: string; url: string; instructions: string[] };
    requirements: { runtimes: string[]; accounts: string[]; operatingSystems: string[]; dependencies: string[] };
    license: string | null; documentationUrl: string | null; supportUrl: string | null;
  };
}
export interface MarketplaceLibraryEntry {
  acquisitionId: string; acquiredAt: string;
  product: {
    id: string; slug: string; name: string; type: ProductType; typeKey: MarketplaceItemTypeKey | null;
    outcome: string; creator: { name: string; handle: string };
  };
  release: { id: string; version: string; sourceStatus: string } | null;
  installationAvailable: boolean;
}
export interface MarketplaceCategory { name: string; slug: string; products: number; }
export interface MarketplaceHome { products: Product[]; creators: Creator[]; categories: MarketplaceCategory[]; total: number; }
export interface ProductPageResult { data: Product[]; meta: { page: number; limit: number; total: number; totalPages: number }; }
export interface ProductFilters { q?: string; type?: string; category?: string; platform?: string; verified?: boolean; minRating?: number; sort?: string; page?: number; limit?: number; }
