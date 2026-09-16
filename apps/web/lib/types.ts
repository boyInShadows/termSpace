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
  installationSteps: string[]; previewFiles: string[]; previewExcerpt: string | null;
  requirements: string | null; permissions: string | null; license: string | null;
  updatesPolicy: string | null; refundPolicy: string | null;
  versions: ProductVersion[]; reviews: Review[]; related: Product[];
}
export interface MarketplaceCategory { name: string; slug: string; products: number; }
export interface MarketplaceHome { products: Product[]; creators: Creator[]; categories: MarketplaceCategory[]; total: number; }
export interface ProductPageResult { data: Product[]; meta: { page: number; limit: number; total: number; totalPages: number }; }
export interface ProductFilters { q?: string; type?: string; category?: string; platform?: string; price?: string; verified?: boolean; minRating?: number; sort?: string; page?: number; limit?: number; }
