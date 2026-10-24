import type { Request, Response } from "express";
import { Prisma, type MarketplacePermissionCapability } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  MARKETPLACE_DATABASE_ITEM_TYPES,
  MARKETPLACE_ITEM_TYPES,
  MARKETPLACE_ITEM_TYPE_REGISTRY,
  marketplaceItemTypeKey,
} from "../lib/marketplaceManifest.js";

const publicCreatorProducts = { published: true, lifecycleState: { notIn: ["SUSPENDED", "ARCHIVED"] } } satisfies Prisma.MarketplaceProductWhereInput;

const productInclude = {
  creator: { select: { id: true, name: true, handle: true, initials: true, verified: true, bio: true, followers: true, _count: { select: { products: { where: publicCreatorProducts } } } } },
  category: { select: { name: true, slug: true } },
  compatibility: {
    select: { platformKey: true, platform: { select: { nameEn: true, nameFa: true } } },
    orderBy: { platform: { position: "asc" as const } },
  },
  communityPlacements: {
    where: { state: "APPROVED" as const, community: { state: "ACTIVE" as const } },
    select: { community: { select: { slug: true, nameEn: true, nameFa: true, primaryPlatform: true } } },
    orderBy: { community: { nameEn: "asc" as const } },
  },
} as const;

function serializeProduct(product: any) {
  return {
    ...product,
    typeKey: marketplaceItemTypeKey(product.itemType),
    rating: Number(product.rating),
    pricing: { amountMinor: product.priceMinor, currency: product.currency, model: product.pricingModel },
    compatibility: {
      platforms: product.compatibility?.map((entry: any) => entry.platform.nameEn) ?? product.platforms,
      platformKeys: product.compatibility?.map((entry: any) => entry.platformKey) ?? product.platforms,
      models: product.models,
    },
    communities: product.communityPlacements?.map((placement: any) => placement.community) ?? [],
    category: product.category.name,
    creator: product.creator ? {
      ...product.creator,
      products: product.creator._count?.products ?? product.creator.products ?? 0,
      _count: undefined,
    } : undefined,
    priceMinor: undefined,
    currency: undefined,
    pricingModel: undefined,
    platforms: undefined,
    models: undefined,
    categoryId: undefined,
    creatorId: undefined,
    itemType: undefined,
    classificationRequired: undefined,
    lifecycleState: undefined,
    lifecycleVersion: undefined,
    lifecycleResumeState: undefined,
    lifecycleResumePublished: undefined,
    approvedSnapshotId: undefined,
    proposedSnapshotId: undefined,
    installationSteps: undefined,
    communityPlacements: undefined,
  };
}

const searchTerms = (q: unknown): string[] => (q ? String(q).split(/\s+/).filter(Boolean).slice(0, 8) : []);

function marketplaceProductWhere(filters: any, communitySlug?: string): Prisma.MarketplaceProductWhereInput {
  const { q, type, category, community, platform, permission, verified, minRating } = filters;
  const selectedCommunity = communitySlug ?? community;
  const terms = searchTerms(q);
  return {
    published: true,
    ...(terms.length ? { AND: terms.map((term) => {
      const pattern = term.replace(/[\\%_]/g, "\\$&");
      const tag = term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return { OR: [
        { slug: { contains: pattern, mode: "insensitive" as const } },
        { name: { contains: pattern, mode: "insensitive" as const } },
        { outcome: { contains: pattern, mode: "insensitive" as const } },
        { description: { contains: pattern, mode: "insensitive" as const } },
        { type: { contains: pattern, mode: "insensitive" as const } },
        { version: { contains: pattern, mode: "insensitive" as const } },
        ...(tag ? [{ tags: { has: tag } }] : []),
        { models: { has: term } },
        { creator: { OR: [
          { name: { contains: pattern, mode: "insensitive" as const } },
          { handle: { contains: pattern, mode: "insensitive" as const } },
          { bio: { contains: pattern, mode: "insensitive" as const } },
        ] } },
        { category: { OR: [
          { name: { contains: pattern, mode: "insensitive" as const } },
          { slug: { contains: pattern, mode: "insensitive" as const } },
        ] } },
        { compatibility: { some: { OR: [
          { platformKey: { contains: pattern, mode: "insensitive" as const } },
          { platform: { OR: [
            { nameEn: { contains: pattern, mode: "insensitive" as const } },
            { nameFa: { contains: pattern, mode: "insensitive" as const } },
          ] } },
        ] } } },
        { communityPlacements: { some: {
          state: "APPROVED" as const,
          community: {
            state: "ACTIVE" as const,
            OR: [
              { slug: { contains: pattern, mode: "insensitive" as const } },
              { nameEn: { contains: pattern, mode: "insensitive" as const } },
              { nameFa: { contains: pattern, mode: "insensitive" as const } },
              { descriptionEn: { contains: pattern, mode: "insensitive" as const } },
              { descriptionFa: { contains: pattern, mode: "insensitive" as const } },
            ],
          },
        } } },
      ] };
    }) } : {}),
    ...(type ? { itemType: MARKETPLACE_DATABASE_ITEM_TYPES[type as keyof typeof MARKETPLACE_DATABASE_ITEM_TYPES] } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(selectedCommunity ? { communityPlacements: { some: { state: "APPROVED", community: { slug: selectedCommunity, state: "ACTIVE" } } } } : {}),
    ...(platform ? { compatibility: { some: { platformKey: platform } } } : {}),
    ...(permission ? { approvedSnapshot: { releaseManifest: { permissions: { some: { capability: permission.toUpperCase() as MarketplacePermissionCapability } } } } } : {}),
    ...(verified ? { verified: true } : {}),
    ...(minRating ? { rating: { gte: minRating } } : {}),
  };
}

function productOrderBy(sort: string) {
  return sort === "rating" ? [{ rating: "desc" as const }, { reviewCount: "desc" as const }, { id: "asc" as const }]
    : sort === "newest" ? [{ updatedAt: "desc" as const }, { id: "asc" as const }]
      : [{ featured: "desc" as const }, { usageCount: "desc" as const }, { id: "asc" as const }];
}

function serializeAcquisition(order: { id: string; status: string; releaseManifestId: string | null; createdAt: Date }) {
  return { id: order.id, status: order.status, releaseManifestId: order.releaseManifestId, acquiredAt: order.createdAt };
}

function trustedInstallationUrl(sourceKind: string, value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (sourceKind === "NPM") return url.hostname === "registry.npmjs.org";
    if (["GITHUB_REPOSITORY", "GITHUB_RELEASE"].includes(sourceKind)) return url.hostname === "github.com";
    return false;
  } catch {
    return false;
  }
}

function serializeReleaseSource(release: {
  sourceKind: string; sourceUrl: string; sourceRef: string; sourcePath: string | null;
  providerIntegrityDigest: string | null; artifactSizeBytes: number | null;
  sourceCheckStatus: string; sourceCheckedAt: Date | null;
}) {
  return {
    kind: release.sourceKind.toLowerCase(),
    url: release.sourceUrl,
    ref: release.sourceRef,
    path: release.sourcePath,
    integrityDigest: release.providerIntegrityDigest,
    artifactSizeBytes: release.artifactSizeBytes,
    status: release.sourceCheckStatus.toLowerCase(),
    checkedAt: release.sourceCheckedAt,
  };
}

/**
 * What anyone may see about the newest published release: where it comes from,
 * what it declares, how to fetch the exact pinned artifact. Creator-written
 * installation steps stay behind the library entitlement.
 */
async function findPublicRelease(productId: string, version?: string) {
  const release = await prisma.marketplaceReleaseManifest.findFirst({
    where: { productVersion: version === undefined ? { productId } : { productId, version }, publishedAt: { not: null }, sourceCheckStatus: { in: ["VERIFIED", "STALE"] } },
    orderBy: { publishedAt: "desc" },
    select: {
      sourceKind: true, sourceUrl: true, sourceRef: true, sourcePath: true,
      providerIntegrityDigest: true, artifactSizeBytes: true, sourceCheckStatus: true, sourceCheckedAt: true,
      resolvedInstallationUrl: true, installationMethod: true, licenseIdentifier: true, customLicenseUrl: true,
      productVersion: { select: { version: true } },
      permissions: { select: { capability: true, required: true, scope: true, destinations: true, purpose: true } },
      environmentVariables: { select: { name: true, purpose: true, required: true, sensitive: true } },
      mcpServerDetails: { select: { transport: true } },
    },
  });
  if (!release || !trustedInstallationUrl(release.sourceKind, release.resolvedInstallationUrl)) return null;
  return {
    version: release.productVersion.version,
    source: serializeReleaseSource(release),
    installation: { method: release.installationMethod.toLowerCase(), url: release.resolvedInstallationUrl },
    permissions: release.permissions.map((item) => ({ ...item, capability: item.capability.toLowerCase() })),
    environment: release.environmentVariables,
    license: release.licenseIdentifier ?? release.customLicenseUrl,
    mcp: release.mcpServerDetails ? { transport: release.mcpServerDetails.transport } : null,
  };
}

export function listMarketplaceItemTypes(_req: Request, res: Response) {
  res.json({ data: MARKETPLACE_ITEM_TYPES.map((key) => ({ key, ...MARKETPLACE_ITEM_TYPE_REGISTRY[key] })) });
}

export async function getMarketplaceHome(_req: Request, res: Response) {
  const [products, creators, categories, types, platforms, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where: { published: true, featured: true }, include: productInclude, orderBy: [{ usageCount: "desc" }], take: 3 }),
    prisma.marketplaceCreator.findMany({ where: { products: { some: { published: true } } }, select: { id: true, name: true, handle: true, initials: true, verified: true, bio: true, followers: true, _count: { select: { products: { where: { published: true } } } } }, orderBy: [{ verified: "desc" }, { followers: "desc" }], take: 3 }),
    prisma.marketplaceCategory.findMany({ where: { products: { some: { published: true } } }, select: { name: true, slug: true, _count: { select: { products: { where: { published: true } } } } }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    // Grouped on `itemType`, the same field the catalogue's `?type=` filter
    // matches, and returned as its stable key. A count that did not agree with
    // the page it links to would be worse than no count.
    prisma.marketplaceProduct.groupBy({ by: ["itemType"], where: { published: true }, _count: { _all: true } }),
    prisma.marketplacePlatform.findMany({ select: { key: true, nameEn: true, nameFa: true }, orderBy: [{ position: "asc" }, { nameEn: "asc" }] }),
    prisma.marketplaceProduct.count({ where: { published: true } }),
  ]);
  res.json({ data: {
    products: products.map(serializeProduct),
    creators: creators.map((creator) => ({ ...creator, products: creator._count.products, _count: undefined })),
    categories: categories.map((category) => ({ name: category.name, slug: category.slug, products: category._count.products })),
    types: types.flatMap((group) => {
      const key = marketplaceItemTypeKey(group.itemType);
      return key ? [{ type: key, products: group._count._all }] : [];
    }),
    platforms,
    total,
  } });
}

/**
 * Orders already-matched listings by how well each search term hit them: the
 * name first, then tags, outcome, creator, category and description. Every id
 * here already matched every term, so this only decides the order.
 */
async function rankMatchedProducts(ids: string[], terms: string[], offset: number, limit: number): Promise<string[]> {
  const lowered = terms.map((term) => term.toLowerCase());
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT p.id
    FROM "MarketplaceProduct" p
    JOIN "MarketplaceCreator" c ON c.id = p."creatorId"
    JOIN "MarketplaceCategory" k ON k.id = p."categoryId"
    WHERE p.id = ANY(${ids}::text[])
    ORDER BY (
      SELECT COALESCE(SUM(
          (CASE WHEN lower(p.name) = t THEN 20 ELSE 0 END)
        + (CASE WHEN strpos(lower(p.name), t) > 0 THEN 10 ELSE 0 END)
        + (CASE WHEN strpos(' ' || lower(p.name), ' ' || t) > 0 THEN 5 ELSE 0 END)
        + (CASE WHEN EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE strpos(lower(tag), t) > 0) THEN 6 ELSE 0 END)
        + (CASE WHEN strpos(lower(p.outcome), t) > 0 THEN 4 ELSE 0 END)
        + (CASE WHEN strpos(lower(c.name), t) > 0 OR strpos(lower(c.handle), t) > 0 THEN 3 ELSE 0 END)
        + (CASE WHEN strpos(lower(k.name), t) > 0 THEN 2 ELSE 0 END)
        + (CASE WHEN strpos(lower(p.description), t) > 0 THEN 1 ELSE 0 END)
      ), 0)
      FROM unnest(${lowered}::text[]) AS t
    ) DESC, p.featured DESC, p."usageCount" DESC, p.id ASC
    OFFSET ${offset} LIMIT ${limit}`);
  return rows.map((row) => row.id);
}

/** One page of listings plus the total, shared by the catalogue and community lists. */
const MAX_RELEVANCE_MATCHES = 2000;

async function findProductPage(where: Prisma.MarketplaceProductWhereInput, filters: { q?: string; sort: string; page: number; limit: number }) {
  const { q, sort, page, limit } = filters;
  const terms = searchTerms(q);
  if (sort !== "relevance" || !terms.length) {
    const orderBy = productOrderBy(sort === "relevance" ? "featured" : sort);
    const [products, total] = await Promise.all([
      prisma.marketplaceProduct.findMany({ where, include: productInclude, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.marketplaceProduct.count({ where }),
    ]);
    return { products, total };
  }
  // ponytail: the text match is evaluated once, over ids only, and its length is
  // the total. Every match id is held and ranked, which measured fine for
  // thousands of matches over 20k listings (a text search is ~100 ms there);
  // past tens of thousands of matches, move to pg_trgm/tsvector instead.
  // Capped so a broad term cannot make one request rank the whole catalogue.
  const matches = await prisma.marketplaceProduct.findMany({ where, select: { id: true }, take: MAX_RELEVANCE_MATCHES });
  const total = matches.length;
  const pageIds = total ? await rankMatchedProducts(matches.map((match) => match.id), terms, (page - 1) * limit, limit) : [];
  const rows = pageIds.length ? await prisma.marketplaceProduct.findMany({ where: { id: { in: pageIds } }, include: productInclude }) : [];
  const position = new Map(pageIds.map((id, index) => [id, index]));
  return { products: rows.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0)), total };
}

export async function listMarketplaceProducts(req: Request, res: Response) {
  const { q, sort, page, limit } = req.query as any;
  const { products, total } = await findProductPage(marketplaceProductWhere(req.query), { q, sort, page, limit });
  res.json({ data: products.map(serializeProduct), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getMarketplaceCreator(req: Request, res: Response) {
  const creator = await prisma.marketplaceCreator.findFirst({
    where: { handle: String(req.params.handle), products: { some: publicCreatorProducts } },
    select: {
      id: true, name: true, handle: true, initials: true, verified: true, bio: true, followers: true,
    },
  });
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } });
    return;
  }
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { products, total } = await findProductPage({ ...publicCreatorProducts, creatorId: creator.id }, { sort: "newest", page, limit });
  res.json({ data: { creator: { ...creator, products: total }, products: products.map(serializeProduct) }, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function listMarketplaceCommunities(_req: Request, res: Response) {
  const communities = await prisma.marketplaceCommunity.findMany({
    where: { state: "ACTIVE" },
    select: {
      slug: true, nameEn: true, nameFa: true, descriptionEn: true, descriptionFa: true,
      primaryPlatform: true, rulesEn: true, rulesFa: true, submissionGuidanceEn: true, submissionGuidanceFa: true, state: true,
      _count: { select: { placements: { where: { state: "APPROVED", product: { published: true } } } } },
    },
    orderBy: { nameEn: "asc" },
  });
  res.json({ data: communities.map(({ _count, state, ...community }) => ({ ...community, state: state.toLowerCase(), products: _count.placements })) });
}

export async function getMarketplaceCommunity(req: Request, res: Response) {
  const community = await prisma.marketplaceCommunity.findUnique({
    where: { slug: String(req.params.slug) },
    select: {
      slug: true, nameEn: true, nameFa: true, descriptionEn: true, descriptionFa: true,
      primaryPlatform: true, rulesEn: true, rulesFa: true, submissionGuidanceEn: true, submissionGuidanceFa: true, state: true,
    },
  });
  if (!community) {
    res.status(404).json({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    return;
  }
  const { sort, page, limit } = req.query as any;
  if (community.state === "ARCHIVED") {
    res.json({ data: { community: { ...community, state: "archived" }, products: [] }, meta: { page, limit, total: 0, totalPages: 0 } });
    return;
  }
  const { products, total } = await findProductPage(marketplaceProductWhere(req.query, community.slug), { q: (req.query as any).q, sort, page, limit });
  res.json({
    data: { community: { ...community, state: "active" }, products: products.map(serializeProduct) },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getMarketplaceProduct(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({
    where: { slug: String(req.params.slug), published: true },
    include: {
      ...productInclude,
      versions: {
        where: { releaseManifests: { some: { publishedAt: { not: null } } } },
        orderBy: { releasedAt: "desc" },
      },
      // Only what a visitor may see: never the reviewer's account or a moderator's notes.
      reviews: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, author: true, rating: true, body: true, verifiedPurchase: true, createdAt: true },
      },
    },
  });
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const [related, release] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where: { published: true, id: { not: product.id }, categoryId: product.categoryId },
      include: productInclude,
      orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
      take: 3,
    }),
    findPublicRelease(product.id),
  ]);
  res.json({ data: { ...serializeProduct(product), versions: product.versions, reviews: product.reviews, related: related.map(serializeProduct), release: release && { ...release, current: true } } });
}

/** The public facts of one published release, so a reader can inspect the version they are about to add. */
export async function getMarketplaceRelease(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({ where: { slug: String(req.params.slug), published: true }, select: { id: true } });
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const [release, newest] = await Promise.all([findPublicRelease(product.id, String(req.params.version)), findPublicRelease(product.id)]);
  if (!release) { res.status(404).json({ error: { code: "RELEASE_NOT_FOUND", message: "No published release has this version" } }); return; }
  res.json({ data: { ...release, current: newest?.version === release.version } });
}

export async function listMarketplaceFavorites(_req: Request, res: Response) {
  const favorites = await prisma.marketplaceFavorite.findMany({ where: { userId: res.locals.reader.id }, select: { product: { select: { slug: true } } } });
  res.json({ data: favorites.map((item) => item.product.slug) });
}

export async function listMarketplaceLibrary(req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store");
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const where = { userId: res.locals.reader.id as string, status: "completed" } as const;
  const select = {
      id: true,
      createdAt: true,
      product: { select: { id: true, slug: true, name: true, type: true, itemType: true, outcome: true, published: true, creator: { select: { name: true, handle: true } } } },
      releaseManifest: { select: { id: true, sourceCheckStatus: true, productVersion: { select: { version: true } } } },
  } as const;
  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select, skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceOrder.count({ where }),
  ]);
  res.json({ data: orders.map((order) => ({
    acquisitionId: order.id,
    acquiredAt: order.createdAt,
    product: {
      id: order.product.id,
      slug: order.product.slug,
      name: order.product.name,
      type: order.product.type,
      typeKey: marketplaceItemTypeKey(order.product.itemType),
      outcome: order.product.outcome,
      creator: order.product.creator,
    },
    release: order.releaseManifest ? {
      id: order.releaseManifest.id,
      version: order.releaseManifest.productVersion.version,
      sourceStatus: order.releaseManifest.sourceCheckStatus.toLowerCase(),
    } : null,
    installationAvailable: Boolean(order.product.published
      && order.releaseManifest
      && ["VERIFIED", "STALE"].includes(order.releaseManifest.sourceCheckStatus)),
  })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

/** The release a reader named, only if it passes the same gates as the approved one. */
async function findAcquirableRelease(productId: string, version: string) {
  const release = await prisma.marketplaceReleaseManifest.findFirst({
    where: { productVersion: { productId, version }, publishedAt: { not: null }, sourceCheckStatus: { in: ["VERIFIED", "STALE"] } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, publishedAt: true, sourceCheckStatus: true, sourceKind: true, resolvedInstallationUrl: true },
  });
  return release && trustedInstallationUrl(release.sourceKind, release.resolvedInstallationUrl) ? release : null;
}

async function findPublishedProduct(slug: string) {
  return prisma.marketplaceProduct.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      priceMinor: true,
      currency: true,
      pricingModel: true,
      approvedSnapshot: {
        select: {
          releaseManifest: { select: { id: true, publishedAt: true, sourceCheckStatus: true } },
        },
      },
    },
  });
}

export async function addMarketplaceFavorite(req: Request, res: Response) {
  const product = await findPublishedProduct(String(req.params.slug));
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  await prisma.marketplaceFavorite.upsert({ where: { userId_productId: { userId: res.locals.reader.id, productId: product.id } }, create: { userId: res.locals.reader.id, productId: product.id }, update: {} });
  res.status(204).send();
}

export async function removeMarketplaceFavorite(req: Request, res: Response) {
  await prisma.marketplaceFavorite.deleteMany({ where: { userId: res.locals.reader.id, product: { slug: String(req.params.slug) } } });
  res.status(204).send();
}

export async function getMarketplaceInstallation(req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store");
  const entitlement = await prisma.marketplaceOrder.findFirst({
    where: {
      userId: res.locals.reader.id as string,
      status: "completed",
      product: { slug: String(req.params.slug) },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      product: { select: { id: true, slug: true, name: true, published: true } },
      releaseManifest: { select: {
        id: true,
        sourceKind: true,
        sourceUrl: true,
        sourceRef: true,
        sourcePath: true,
        providerIntegrityDigest: true,
        artifactSizeBytes: true,
        resolvedInstallationUrl: true,
        sourceCheckStatus: true,
        sourceCheckedAt: true,
        installationMethod: true,
        installationInstructions: true,
        runtimeRequirements: true,
        accountRequirements: true,
        operatingSystems: true,
        dependencyRequirements: true,
        documentationUrl: true,
        supportUrl: true,
        licenseIdentifier: true,
        customLicenseUrl: true,
        publishedAt: true,
        productVersion: { select: { productId: true, version: true } },
      } },
    },
  });
  if (!entitlement) {
    res.status(404).json({ error: { code: "ACQUISITION_NOT_FOUND", message: "Add this resource to your library before viewing installation details" } });
    return;
  }
  const release = entitlement.releaseManifest;
  const available = entitlement.product.published
    && release?.publishedAt
    && release.productVersion.productId === entitlement.product.id
    && ["VERIFIED", "STALE"].includes(release.sourceCheckStatus)
    && trustedInstallationUrl(release.sourceKind, release.resolvedInstallationUrl);
  if (!available || !release) {
    res.status(409).json({ error: { code: "INSTALLATION_UNAVAILABLE", message: "Installation is unavailable while this resource or its pinned release is restricted" } });
    return;
  }
  res.json({ data: {
    acquisition: { id: entitlement.id, status: entitlement.status, acquiredAt: entitlement.createdAt },
    product: { slug: entitlement.product.slug, name: entitlement.product.name },
    release: {
      id: release.id,
      version: release.productVersion.version,
      source: serializeReleaseSource(release),
      installation: {
        method: release.installationMethod.toLowerCase(),
        url: release.resolvedInstallationUrl,
        instructions: release.installationInstructions,
      },
      requirements: {
        runtimes: release.runtimeRequirements,
        accounts: release.accountRequirements,
        operatingSystems: release.operatingSystems,
        dependencies: release.dependencyRequirements,
      },
      license: release.licenseIdentifier ?? release.customLicenseUrl,
      documentationUrl: release.documentationUrl,
      supportUrl: release.supportUrl,
    },
  } });
}

export async function acquireMarketplaceProduct(req: Request, res: Response) {
  const key = req.header("Idempotency-Key");
  if (!key || key.length < 16 || key.length > 128) {
    res.status(400).json({ error: { code: "IDEMPOTENCY_KEY_REQUIRED", message: "A 16-128 character Idempotency-Key header is required" } });
    return;
  }
  const product = await findPublishedProduct(String(req.params.slug));
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const requested = (req.body as { version?: string } | undefined)?.version;
  const named = requested === undefined ? undefined : await findAcquirableRelease(product.id, requested);
  const existing = await prisma.marketplaceOrder.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    if (existing.userId !== res.locals.reader.id || existing.productId !== product.id || (requested !== undefined && existing.releaseManifestId !== named?.id)) {
      res.status(409).json({ error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for another acquisition" } });
      return;
    }
    res.json({ data: serializeAcquisition(existing) });
    return;
  }
  const existingEntitlement = await prisma.marketplaceOrder.findUnique({
    where: { userId_productId: { userId: res.locals.reader.id, productId: product.id } },
  });
  if (existingEntitlement) {
    if (requested !== undefined && existingEntitlement.releaseManifestId !== named?.id) {
      res.status(409).json({ error: { code: "ALREADY_IN_LIBRARY", message: "This resource is already in your library at a different release" } });
      return;
    }
    res.json({ data: serializeAcquisition(existingEntitlement) });
    return;
  }
  if (product.priceMinor > 0 || product.pricingModel !== "free") {
    res.status(409).json({ error: { code: "RESOURCE_NOT_FREE", message: "This resource is not available for community installation" } });
    return;
  }
  const releaseManifest = requested === undefined ? product.approvedSnapshot?.releaseManifest : named;
  if (!releaseManifest?.publishedAt || !["VERIFIED", "STALE"].includes(releaseManifest.sourceCheckStatus)) {
    res.status(409).json({ error: { code: "RELEASE_UNAVAILABLE", message: "This resource does not have an approved release available for acquisition" } });
    return;
  }
  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.marketplaceOrder.create({ data: {
        userId: res.locals.reader.id,
        productId: product.id,
        releaseManifestId: releaseManifest.id,
        idempotencyKey: key,
        amountMinor: 0,
        currency: product.currency,
        status: "completed",
      } });
      await tx.marketplaceProduct.update({ where: { id: product.id }, data: { purchaseCount: { increment: 1 }, usageCount: { increment: 1 } } });
      return created;
    });
    res.status(201).json({ data: serializeAcquisition(order) });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const [sameKey, sameEntitlement] = await Promise.all([
      prisma.marketplaceOrder.findUnique({ where: { idempotencyKey: key } }),
      prisma.marketplaceOrder.findUnique({ where: { userId_productId: { userId: res.locals.reader.id, productId: product.id } } }),
    ]);
    const existing = sameKey ?? sameEntitlement;
    if (!existing) throw error;
    if (sameKey && (sameKey.userId !== res.locals.reader.id || sameKey.productId !== product.id)) {
      res.status(409).json({ error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for another acquisition" } });
      return;
    }
    res.json({ data: serializeAcquisition(existing) });
  }
}
