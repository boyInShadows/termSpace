export type ProductType = "Prompt" | "Prompt pack" | "Skill" | "Agent" | "Workflow" | "MCP server" | "Integration" | "Rule" | "Hook" | "Template" | "AI tool" | "Developer utility";
export type MarketplaceItemTypeKey = "skill" | "agent" | "mcp_server" | "integration" | "rule" | "prompt" | "hook" | "template" | "workflow";
export interface MarketplaceItemType { key: MarketplaceItemTypeKey; en: string; fa: string; definition: string; }
export type Platform = "ChatGPT" | "Claude" | "Codex" | "Cursor" | "VS Code" | "Gemini" | "API";
export type AIModel = "GPT-5" | "Claude 4" | "Gemini 2.5" | "Model agnostic";
export interface Creator { id: string; name: string; handle: string; initials: string; verified: boolean; bio: string; products: number; followers: number; }
export interface OwnedCreatorProfile extends Creator { createdAt: string; updatedAt: string; accessActive: boolean; }
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
export interface CreatorProfile { id: string; name: string; handle: string; initials: string; verified: boolean; bio: string; followers: number; }
export interface OwnedProduct {
  id: string; slug: string; name: string; type: ProductType; outcome: string; description: string;
  tags: string[]; platforms: Platform[]; models: AIModel[]; version: string; published: boolean;
  rating: number; reviewCount: number; usageCount: number; purchaseCount: number;
  verified: boolean; featured: boolean; category: string; createdAt: string; updatedAt: string;
}
export interface PublishingCategory { name: string; slug: string; }
export interface CreatorProfileInput { name: string; handle: string; bio: string; }
export interface ProductSubmission {
  name: string; slug: string; type: ProductType; category: string; outcome: string;
  description: string; platforms: Platform[]; models: AIModel[]; tags: string[]; version?: string;
}
