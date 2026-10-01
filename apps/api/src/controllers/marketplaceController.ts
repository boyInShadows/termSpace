import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { MarketplaceRequestError } from "../lib/marketplaceRequestError.js";
import { marketplacePlatforms, marketplaceModels, platformSchema, modelSchema } from "../lib/marketplaceCompatibility.js";
import { publicProductWhere, publicCreatorWhere, publicCreatorSelect, publicPlacementWhere, activeRestrictions } from "../lib/marketplaceVisibility.js";
import {
  MARKETPLACE_DATABASE_ITEM_TYPES,
  MARKETPLACE_ITEM_TYPES,
  LEGACY_ITEM_TYPE_MAP,
  MARKETPLACE_ITEM_TYPE_REGISTRY,
  marketplaceItemTypeKey,
} from "../lib/marketplaceManifest.js";

export const productInclude = {
  creator: { select: publicCreatorSelect },
  category: { select: { name: true, slug: true } },
  communityPlacements: { where: publicPlacementWhere, select: { id: true, community: { select: { slug: true, nameEn: true, nameFa: true } } }, orderBy: { community: { slug: "asc" as const } } },
} as const;

const accessSelect = {
  trustCases: { where: { targetType: "PRODUCT" as const, ...activeRestrictions }, select: { id: true } },
  creator: { select: {
    owner: { select: { marketplaceTrustCases: { where: { targetType: "USER" as const, ...activeRestrictions }, select: { id: true } } } },
  } },
} as const;

function productRestricted(product: { trustCases?: { id: string }[]; creator?: { trustCases?: { id: string }[]; owner?: { marketplaceTrustCases?: { id: string }[] } | null } }) {
  return Boolean(product.trustCases?.length || product.creator?.owner?.marketplaceTrustCases?.length);
}

export function serializeProduct(product: any) {
  return {
    ...product,
    typeKey: marketplaceItemTypeKey(product.itemType),
    rating: Number(product.rating),
    pricing: { amountMinor: product.priceMinor, currency: product.currency, model: product.pricingModel },
    compatibility: {
      platforms: product.platforms.map((value: string) => platformSchema.parse(value)),
      models: product.models.map((value: string) => modelSchema.parse(value)),
      platformLabels: Object.fromEntries(marketplacePlatforms.map(({ key, name }) => [key, name])),
    },
    communities: product.communityPlacements?.map((placement: any) => ({ id: placement.id, ...placement.community })) ?? [],
    communityPlacements: undefined,
    categorySlug: product.category.slug,
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
  };
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
  const [products, creators, categories, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where: { ...publicProductWhere, featured: true }, include: productInclude, orderBy: [{ usageCount: "desc" }, { id: "asc" }], take: 3 }),
    prisma.marketplaceCreator.findMany({ where: { ...publicCreatorWhere, products: { some: publicProductWhere } }, select: publicCreatorSelect, orderBy: [{ verified: "desc" }, { followers: "desc" }, { id: "asc" }], take: 3 }),
    prisma.marketplaceCategory.findMany({ where: { products: { some: publicProductWhere } }, select: { name: true, slug: true, _count: { select: { products: { where: publicProductWhere } } } }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    prisma.marketplaceProduct.count({ where: publicProductWhere }),
  ]);
  res.json({ data: {
    products: products.map(serializeProduct),
    creators: creators.map((creator) => ({ ...creator, products: creator._count.products, _count: undefined })),
    categories: categories.map((category) => ({ name: category.name, slug: category.slug, products: category._count.products })),
    total,
  } });
}

export async function listMarketplaceProducts(req: Request, res: Response) {
  const { q, type, category, platform, model, community, creator, collection, verified, minRating, sort, page, limit } = req.query as any;
  const typeKey = MARKETPLACE_ITEM_TYPES.includes(type) ? type : LEGACY_ITEM_TYPE_MAP[type];
  const matchingKeys = (entries: ReadonlyArray<{ key: string; name: string }>) => entries.filter((entry) => entry.key.includes(q.toLowerCase()) || entry.name.toLowerCase().includes(q.toLowerCase())).map((entry) => entry.key);
  const where: any = {
    ...publicProductWhere,
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { outcome: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { creator: { name: { contains: q, mode: "insensitive" } } },
      { creator: { handle: { contains: q, mode: "insensitive" } } },
      { tags: { has: q.toLowerCase() } },
      { platforms: { hasSome: matchingKeys(marketplacePlatforms) } },
      { models: { hasSome: matchingKeys(marketplaceModels) } },
      { communityPlacements: { some: { ...publicPlacementWhere, community: { state: "ACTIVE", OR: [{ nameEn: { contains: q, mode: "insensitive" } }, { nameFa: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } } } },
    ] } : {}),
    ...(type ? typeKey
      ? { itemType: MARKETPLACE_DATABASE_ITEM_TYPES[typeKey as keyof typeof MARKETPLACE_DATABASE_ITEM_TYPES] }
      : { type }
    : {}),
    ...(category ? { category: { OR: [{ slug: category }, { name: category }] } } : {}),
    ...(platform ? { platforms: { has: platform } } : {}),
    ...(model ? { models: { has: model } } : {}),
    ...(community ? { communityPlacements: { some: { ...publicPlacementWhere, community: { slug: community, state: "ACTIVE" } } } } : {}),
    ...(creator ? { creator: { ...publicCreatorWhere, handle: creator } } : {}),
    ...(collection ? { collectionItems: { some: { collection: { slug: collection, published: true, ...(creator ? { creator: { handle: creator } } : {}) } } } } : {}),
    ...(verified ? { verified: true } : {}),
    ...(minRating ? { rating: { gte: minRating } } : {}),
  };
  const orderBy: any = sort === "rating" ? [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }]
    : sort === "newest" ? [{ updatedAt: "desc" }, { id: "asc" }]
      : [{ featured: "desc" }, { usageCount: "desc" }, { id: "asc" }];
  const [products, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where, include: productInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceProduct.count({ where }),
  ]);
  res.json({ data: products.map(serializeProduct), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getMarketplaceProduct(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({
    where: { ...publicProductWhere, slug: String(req.params.slug) },
    include: {
      ...productInclude,
      versions: {
        where: { releaseManifests: { some: { publishedAt: { not: null } } } },
        orderBy: { releasedAt: "desc" },
      },
      reviews: { where: { status: "PUBLISHED", trustCases: { none: activeRestrictions } }, select: {
        id: true, userId: true, author: true, rating: true, body: true, createdAt: true,
        response: { select: { id: true, body: true, status: true, trustCases: { where: activeRestrictions, select: { id: true } } } },
      }, orderBy: [{ createdAt: "desc" }, { id: "asc" }] },
      approvedSnapshot: { select: { releaseManifestId: true } },
    },
  });
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const [related, completedOrders] = await Promise.all([prisma.marketplaceProduct.findMany({
    where: { ...publicProductWhere, id: { not: product.id }, categoryId: product.categoryId },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
    take: 3,
  }), prisma.marketplaceOrder.findMany({ where: { productId: product.id, status: "completed", userId: { in: product.reviews.flatMap((review) => review.userId ? [review.userId] : []) } }, select: { userId: true } })]);
  const verifiedUsers = new Set(completedOrders.map((order) => order.userId));
  res.json({ data: { ...serializeProduct(product), approvedSnapshot: undefined, currentReleaseId: product.approvedSnapshot?.releaseManifestId ?? null, versions: product.versions,
    reviews: product.reviews.map(({ userId, response, ...review }) => ({ ...review, verifiedUse: Boolean(userId && verifiedUsers.has(userId)), response: response?.status === "PUBLISHED" && !response.trustCases.length ? { id: response.id, body: response.body } : null })), related: related.map(serializeProduct) } });
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
      product: { select: { id: true, slug: true, name: true, type: true, itemType: true, outcome: true, published: true, ...accessSelect, creator: { select: { ...accessSelect.creator.select, name: true, handle: true } } } },
      releaseManifest: { select: { id: true, sourceCheckStatus: true, trustCases: { where: activeRestrictions, select: { id: true } }, productVersion: { select: { version: true } } } },
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
      creator: { name: order.product.creator.name, handle: order.product.creator.handle },
    },
    release: order.releaseManifest ? {
      id: order.releaseManifest.id,
      version: order.releaseManifest.productVersion.version,
      sourceStatus: order.releaseManifest.sourceCheckStatus.toLowerCase(),
    } : null,
    installationAvailable: Boolean(order.product.published
      && !productRestricted(order.product)
      && !order.releaseManifest?.trustCases?.length
      && order.releaseManifest
      && ["VERIFIED", "STALE"].includes(order.releaseManifest.sourceCheckStatus)),
  })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

async function findPublishedProduct(slug: string) {
  return prisma.marketplaceProduct.findFirst({
    where: { ...publicProductWhere, slug },
    select: {
      id: true,
      slug: true,
      priceMinor: true,
      currency: true,
      pricingModel: true,
      approvedSnapshot: {
        select: {
          releaseManifest: { select: { id: true, publishedAt: true, sourceCheckStatus: true, trustCases: { where: activeRestrictions, select: { id: true } } } },
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
      product: { select: { id: true, slug: true, name: true, published: true, ...accessSelect } },
      releaseManifest: { select: {
        id: true,
        sourceKind: true,
        trustCases: { where: activeRestrictions, select: { id: true } },
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
    && !productRestricted(entitlement.product)
    && !release?.trustCases?.length
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
  if (!releaseManifest?.publishedAt || releaseManifest.trustCases?.length || !["VERIFIED", "STALE"].includes(releaseManifest.sourceCheckStatus)) {
    res.status(409).json({ error: { code: "RELEASE_UNAVAILABLE", message: "This resource does not have an approved release available for acquisition" } });
    return;
  }
  try {
    const order = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${product.id}, 2))`;
      const current = await tx.marketplaceProduct.findFirst({ where: {
        ...publicProductWhere, id: product.id,
        approvedSnapshot: { releaseManifest: { id: releaseManifest.id, trustCases: { none: activeRestrictions }, sourceCheckStatus: { in: ["VERIFIED", "STALE"] } } },
      }, select: { id: true } });
      if (!current) throw new MarketplaceRequestError(409, "RELEASE_UNAVAILABLE", "The listing or release changed before acquisition; reload it");
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
