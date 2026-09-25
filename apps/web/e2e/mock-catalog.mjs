// The public catalogue for the e2e mock API: the homepage fixture's six
// products (so a featured card on / links to a detail page that exists),
// plus generated ones so Explore has a second page. Node strips the types
// from lib/mock-home.ts on import, so this reuses the exact fixture the
// homepage renders.
import { mockHome } from "../lib/mock-home.ts";

const PAGE_LIMIT_MAX = 48;
const GENERATED = 9;
const DAY = 86_400_000;

const platformKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const generated = Array.from({ length: GENERATED }, (_, index) => {
  const base = mockHome.products[index % mockHome.products.length];
  return {
    ...base,
    id: `mock-generated-${index + 1}`,
    slug: `fixture-listing-${index + 1}`,
    name: `Fixture Listing ${index + 1}`,
    featured: false,
    trending: false,
  };
});

export const CATALOG = [...mockHome.products, ...generated];

export const PLATFORMS = [...new Set(CATALOG.flatMap((product) => product.compatibility.platforms))].map((name) => ({
  key: platformKey(name),
  nameEn: name,
  nameFa: null,
}));

export const ITEM_TYPES = [
  { key: "skill", en: "Skills", fa: "مهارت‌ها", definition: "Reusable instructions an agent can load." },
  { key: "agent", en: "Agents", fa: "عامل‌ها", definition: "A configured agent with a defined job." },
  { key: "mcp_server", en: "MCP servers", fa: "سرورهای MCP", definition: "Tools exposed over the Model Context Protocol." },
  { key: "prompt", en: "Prompts", fa: "پرامپت‌ها", definition: "A prompt written for one outcome." },
  { key: "rule", en: "Rules", fa: "قواعد", definition: "Standing instructions for an editor or agent." },
];

const SORTS = {
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  featured: (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
};

function withPlatformKeys(product) {
  return {
    ...product,
    compatibility: { ...product.compatibility, platformKeys: product.compatibility.platforms.map(platformKey) },
  };
}

export function listProducts(params) {
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const type = params.get("type");
  const platform = params.get("platform");
  const category = params.get("category");
  const verified = params.get("verified") === "true";
  const minRating = Number(params.get("minRating") ?? 0);
  const sort = SORTS[params.get("sort") ?? "featured"] ?? SORTS.featured;
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const limit = Math.min(PAGE_LIMIT_MAX, Math.max(1, Number(params.get("limit") ?? 12) || 12));

  const matches = CATALOG.filter((product) =>
    (!q || `${product.name} ${product.outcome}`.toLowerCase().includes(q)) &&
    (!type || product.typeKey === type) &&
    (!platform || product.compatibility.platforms.some((name) => platformKey(name) === platform)) &&
    (!category || product.category.toLowerCase() === category.toLowerCase()) &&
    (!verified || product.verified) &&
    product.rating >= minRating,
  ).sort(sort);

  const total = matches.length;
  return {
    data: matches.slice((page - 1) * limit, page * limit).map(withPlatformKeys),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export function productDetail(slug) {
  const product = CATALOG.find((candidate) => candidate.slug === slug);
  if (!product) return null;
  const released = (daysAgo) => new Date(Date.parse(product.updatedAt) - daysAgo * DAY).toISOString();
  return {
    ...withPlatformKeys(product),
    packageFileCount: 4,
    packageSizeBytes: 18_432,
    benefits: ["States what it reads before it runs", "Pinned, versioned releases", "Examples for every mode"],
    useCases: [{ title: "Pull requests", description: "Review a diff against the team's standards." }],
    includedFiles: [
      { name: "SKILL.md", description: "The instructions the agent loads." },
      { name: "examples/", description: "Worked inputs and outputs." },
    ],
    exampleInput: null,
    exampleOutputTitle: null,
    exampleOutputBody: null,
    previewFiles: ["SKILL.md"],
    previewExcerpt: "# Review\nRead the diff. State what changed and why it matters.",
    requirements: "Claude Code 1.0 or later",
    permissions: "Reads the current selection · no network access",
    license: "MIT",
    updatesPolicy: "Security fixes within 7 days",
    refundPolicy: null,
    versions: [
      { id: `${product.id}-v3`, version: product.version, releasedAt: released(0), notes: "Adds reviewer checklists for migrations." },
      { id: `${product.id}-v2`, version: "2.3.0", releasedAt: released(30), notes: "Tighter summaries; drops the network permission." },
      { id: `${product.id}-v1`, version: "2.0.0", releasedAt: released(90), notes: "First public release." },
    ],
    reviews: [
      { id: `${product.id}-r1`, author: "Priya S.", rating: 5, createdAt: released(3), body: "Caught a migration mistake in its first week.", verifiedPurchase: true },
    ],
    related: CATALOG.filter((candidate) => candidate.slug !== slug).slice(0, 3).map(withPlatformKeys),
  };
}
