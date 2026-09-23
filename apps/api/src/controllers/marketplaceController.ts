import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  MARKETPLACE_DATABASE_ITEM_TYPES,
  MARKETPLACE_ITEM_TYPES,
  MARKETPLACE_ITEM_TYPE_REGISTRY,
  marketplaceItemTypeKey,
} from "../lib/marketplaceManifest.js";

const productInclude = {
  creator: { select: { id: true, name: true, handle: true, initials: true, verified: true, bio: true, followers: true, _count: { select: { products: true } } } },
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

function marketplaceProductWhere(filters: any, communitySlug?: string): Prisma.MarketplaceProductWhereInput {
  const { q, type, category, community, platform, verified, minRating } = filters;
  const selectedCommunity = communitySlug ?? community;
  const searchTerms = q ? String(q).split(/\s+/).filter(Boolean).slice(0, 8) : [];
  return {
    published: true,
    ...(searchTerms.length ? { AND: searchTerms.map((term) => {
      const tag = term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return { OR: [
        { slug: { contains: term, mode: "insensitive" as const } },
        { name: { contains: term, mode: "insensitive" as const } },
        { outcome: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { type: { contains: term, mode: "insensitive" as const } },
        { version: { contains: term, mode: "insensitive" as const } },
        ...(tag ? [{ tags: { has: tag } }] : []),
        { models: { has: term } },
        { creator: { OR: [
          { name: { contains: term, mode: "insensitive" as const } },
          { handle: { contains: term, mode: "insensitive" as const } },
          { bio: { contains: term, mode: "insensitive" as const } },
        ] } },
        { category: { OR: [
          { name: { contains: term, mode: "insensitive" as const } },
          { slug: { contains: term, mode: "insensitive" as const } },
        ] } },
        { compatibility: { some: { OR: [
          { platformKey: { contains: term, mode: "insensitive" as const } },
          { platform: { OR: [
            { nameEn: { contains: term, mode: "insensitive" as const } },
            { nameFa: { contains: term, mode: "insensitive" as const } },
          ] } },
        ] } } },
        { communityPlacements: { some: {
          state: "APPROVED" as const,
          community: {
            state: "ACTIVE" as const,
            OR: [
              { slug: { contains: term, mode: "insensitive" as const } },
              { nameEn: { contains: term, mode: "insensitive" as const } },
              { nameFa: { contains: term, mode: "insensitive" as const } },
              { descriptionEn: { contains: term, mode: "insensitive" as const } },
              { descriptionFa: { contains: term, mode: "insensitive" as const } },
            ],
          },
        } } },
      ] };
    }) } : {}),
    ...(type ? { itemType: MARKETPLACE_DATABASE_ITEM_TYPES[type as keyof typeof MARKETPLACE_DATABASE_ITEM_TYPES] } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(selectedCommunity ? { communityPlacements: { some: { state: "APPROVED", community: { slug: selectedCommunity, state: "ACTIVE" } } } } : {}),
    ...(platform ? { compatibility: { some: { platformKey: platform } } } : {}),
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

export async function listMarketplaceProducts(req: Request, res: Response) {
  const { sort, page, limit } = req.query as any;
  const where = marketplaceProductWhere(req.query);
  const orderBy = productOrderBy(sort);
  const [products, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where, include: productInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceProduct.count({ where }),
  ]);
  res.json({ data: products.map(serializeProduct), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
  const where = marketplaceProductWhere(req.query, community.slug);
  const [products, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where, include: productInclude, orderBy: productOrderBy(sort), skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceProduct.count({ where }),
  ]);
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
      reviews: { where: { published: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const related = await prisma.marketplaceProduct.findMany({
    where: { published: true, id: { not: product.id }, categoryId: product.categoryId },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
    take: 3,
  });
  res.json({ data: { ...serializeProduct(product), versions: product.versions, reviews: product.reviews, related: related.map(serializeProduct) } });
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
  const product = await findPublishedProduct(String(req.params.slug));
  if (product) await prisma.marketplaceFavorite.deleteMany({ where: { userId: res.locals.reader.id, productId: product.id } });
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
      source: {
        kind: release.sourceKind.toLowerCase(),
        url: release.sourceUrl,
        ref: release.sourceRef,
        path: release.sourcePath,
        integrityDigest: release.providerIntegrityDigest,
        artifactSizeBytes: release.artifactSizeBytes,
        status: release.sourceCheckStatus.toLowerCase(),
        checkedAt: release.sourceCheckedAt,
      },
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
  const existing = await prisma.marketplaceOrder.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    if (existing.userId !== res.locals.reader.id || existing.productId !== product.id) {
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
    res.json({ data: serializeAcquisition(existingEntitlement) });
    return;
  }
  if (product.priceMinor > 0 || product.pricingModel !== "free") {
    res.status(409).json({ error: { code: "RESOURCE_NOT_FREE", message: "This resource is not available for community installation" } });
    return;
  }
  const releaseManifest = product.approvedSnapshot?.releaseManifest;
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
