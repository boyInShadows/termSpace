import type { Creator, MarketplaceCategory, MarketplaceHome, Product } from "./types";

/**
 * The homepage's degraded-mode dataset.
 *
 * The landing page is the first thing anyone sees, and an API that is down,
 * cold-starting, or simply not running on a designer's machine should not turn
 * it into a page of empty headings. This fixture is shaped exactly like a
 * `/api/marketplace/home` response so every section renders its real layout,
 * and the page states plainly that it is showing an example catalogue.
 *
 * It is also what `NEXT_PUBLIC_USE_MOCK=1` serves, so the front end can be
 * worked on without the database running at all.
 */

const creators: Creator[] = [
  {
    id: "mock-creator-mara",
    name: "Mara Chen",
    handle: "marachen",
    initials: "MC",
    verified: true,
    bio: "Conversion strategist turning customer research into AI systems that keep the customer's own words.",
    products: 6,
    followers: 12800,
  },
  {
    id: "mock-creator-ellis",
    name: "Ellis North",
    handle: "ellisnorth",
    initials: "EN",
    verified: true,
    bio: "Developer experience engineer and open-source maintainer. Writes the review tools he wanted on call.",
    products: 9,
    followers: 8400,
  },
  {
    id: "mock-creator-amara",
    name: "Amara Okafor",
    handle: "amara",
    initials: "AO",
    verified: true,
    bio: "Evidence researcher building workflows that keep sources, caveats and uncertainty visible.",
    products: 4,
    followers: 6200,
  },
  {
    id: "mock-creator-jon",
    name: "Jon Bell",
    handle: "jonbuilds",
    initials: "JB",
    verified: false,
    bio: "Independent product builder. Small, sharp tools for people who ship alone.",
    products: 3,
    followers: 2100,
  },
];

type Seed = {
  slug: string;
  name: string;
  type: Product["type"];
  typeKey: Product["typeKey"];
  outcome: string;
  category: string;
  creator: Creator;
  rating: number;
  reviewCount: number;
  usageCount: number;
  featured: boolean;
  trending?: boolean;
  verified: boolean;
  tags: string[];
  platforms: Product["compatibility"]["platforms"];
};

const seeds: Seed[] = [
  {
    slug: "conversion-copywriter",
    name: "Conversion Copywriter",
    type: "Skill",
    typeKey: "skill",
    outcome: "Turn raw customer interviews into landing page copy that still sounds like the customer.",
    category: "Marketing",
    creator: creators[0],
    rating: 4.9,
    reviewCount: 184,
    usageCount: 3200,
    featured: true,
    verified: true,
    tags: ["copywriting", "research"],
    platforms: ["Claude", "ChatGPT", "Cursor"],
  },
  {
    slug: "staff-engineer-review",
    name: "Staff Engineer Review",
    type: "Agent",
    typeKey: "agent",
    outcome: "Review a pull request the way a senior colleague would, with the reasoning left in.",
    category: "Engineering",
    creator: creators[1],
    rating: 4.8,
    reviewCount: 296,
    usageCount: 9400,
    featured: true,
    trending: true,
    verified: true,
    tags: ["code-review", "quality"],
    platforms: ["Claude", "Cursor", "VS Code"],
  },
  {
    slug: "source-keeper",
    name: "Source Keeper",
    type: "MCP server",
    typeKey: "mcp_server",
    outcome: "Keep every claim attached to the source it came from, and say so when there isn't one.",
    category: "Research",
    creator: creators[2],
    rating: 4.7,
    reviewCount: 112,
    usageCount: 2600,
    featured: true,
    verified: true,
    tags: ["research", "citations"],
    platforms: ["Claude", "Codex", "API"],
  },
  {
    slug: "schema-auditor",
    name: "Schema Auditor",
    type: "Skill",
    typeKey: "skill",
    outcome: "Audit a database migration for locks, data loss and missing indexes before it ships.",
    category: "Engineering",
    creator: creators[1],
    rating: 4.6,
    reviewCount: 88,
    usageCount: 1900,
    featured: false,
    verified: true,
    tags: ["database", "migrations"],
    platforms: ["Claude", "Cursor"],
  },
  {
    slug: "release-notes-that-land",
    name: "Release Notes That Land",
    type: "Prompt",
    typeKey: "prompt",
    outcome: "Write release notes from a changelog that a customer will actually finish reading.",
    category: "Product",
    creator: creators[3],
    rating: 4.5,
    reviewCount: 64,
    usageCount: 1400,
    featured: false,
    verified: false,
    tags: ["writing", "changelog"],
    platforms: ["ChatGPT", "Claude"],
  },
  {
    slug: "accessible-by-default",
    name: "Accessible By Default",
    type: "Rule",
    typeKey: "rule",
    outcome: "Hold generated components to WCAG 2.2 AA before they reach a review.",
    category: "Design",
    creator: creators[0],
    rating: 4.8,
    reviewCount: 143,
    usageCount: 4100,
    featured: false,
    trending: true,
    verified: true,
    tags: ["accessibility", "frontend"],
    platforms: ["Cursor", "VS Code", "Claude"],
  },
];

const products: Product[] = seeds.map((seed, index) => ({
  id: `mock-product-${index}`,
  slug: seed.slug,
  name: seed.name,
  type: seed.type,
  typeKey: seed.typeKey,
  outcome: seed.outcome,
  description: seed.outcome,
  creator: seed.creator,
  pricing: { amountMinor: 0, currency: "USD", model: "free" },
  compatibility: { platforms: seed.platforms, models: ["Model agnostic"] },
  category: seed.category,
  rating: seed.rating,
  reviewCount: seed.reviewCount,
  usageCount: seed.usageCount,
  purchaseCount: seed.usageCount,
  // Fixed so the fixture never renders a date in the future and never makes
  // two builds of the same commit differ.
  updatedAt: "2026-09-12T00:00:00.000Z",
  version: "2.4.0",
  featured: seed.featured,
  trending: seed.trending,
  verified: seed.verified,
  tags: seed.tags,
}));

const categories: MarketplaceCategory[] = [
  { name: "Engineering", slug: "engineering", products: 212 },
  { name: "Research", slug: "research", products: 84 },
  { name: "Marketing", slug: "marketing", products: 67 },
  { name: "Design", slug: "design", products: 48 },
  { name: "Product", slug: "product", products: 41 },
  { name: "Data", slug: "data", products: 37 },
  { name: "Support", slug: "support", products: 26 },
  { name: "Security", slug: "security", products: 22 },
  { name: "Operations", slug: "operations", products: 19 },
];

export const mockHome: MarketplaceHome = {
  products,
  creators,
  categories,
  total: categories.reduce((sum, category) => sum + category.products, 0),
};
