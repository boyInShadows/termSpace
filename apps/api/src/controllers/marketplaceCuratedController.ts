import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { productInclude, serializeProduct } from "./marketplaceController.js";
import { publicPlacementWhere, publicProductWhere } from "../lib/marketplaceVisibility.js";
import { MarketplaceRequestError } from "../lib/marketplaceRequestError.js";

const publicCollectionWhere = { published: true, OR: [{ scope: "STAFF" as const }, { scope: "COMMUNITY" as const, community: { state: "ACTIVE" as const } }] };

export async function listPublicCuratedCollections(_req: Request, res: Response) {
  const collections = await prisma.marketplaceCuratedCollection.findMany({
    where: publicCollectionWhere,
    select: { slug: true, titleEn: true, titleFa: true, descriptionEn: true, descriptionFa: true, scope: true, community: { select: { id: true, slug: true, nameEn: true, nameFa: true } }, items: { where: { product: publicProductWhere }, select: { product: { select: { communityPlacements: { where: publicPlacementWhere, select: { communityId: true } } } } } } },
    orderBy: [{ position: "asc" }, { slug: "asc" }], take: 100,
  });
  res.json({ data: collections.map(({ items, community, ...collection }) => ({ ...collection, community: community ? { slug: community.slug, nameEn: community.nameEn, nameFa: community.nameFa } : null, count: collection.scope === "STAFF" ? items.length : items.filter((item) => item.product.communityPlacements.some((placement) => placement.communityId === community?.id)).length })) });
}

export async function getPublicCuratedCollection(req: Request, res: Response) {
  const collection = await prisma.marketplaceCuratedCollection.findFirst({
    where: { ...publicCollectionWhere, slug: String(req.params.slug) },
    select: { slug: true, titleEn: true, titleFa: true, descriptionEn: true, descriptionFa: true, scope: true, community: { select: { slug: true, nameEn: true, nameFa: true } }, items: { where: { product: publicProductWhere }, include: { product: { include: productInclude } }, orderBy: { position: "asc" } } },
  });
  if (!collection) throw new MarketplaceRequestError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  res.json({ data: { ...collection, items: collection.items.filter((item) => collection.scope === "STAFF" || item.product.communityPlacements.some((placement) => placement.community.slug === collection.community?.slug)).map((item) => serializeProduct(item.product)) } });
}

export async function listManagedCuratedCollections(_req: Request, res: Response) {
  const staff = res.locals.reader.marketplaceRoles.includes("administrator");
  res.set("Cache-Control", "private, no-store");
  res.json({ data: await prisma.marketplaceCuratedCollection.findMany({ where: staff ? {} : { scope: "COMMUNITY" }, include: { community: { select: { slug: true } }, items: { select: { productId: true }, orderBy: { position: "asc" } } }, orderBy: [{ position: "asc" }, { slug: "asc" }], take: 100 }) });
}

export async function getCuratedCollectionOptions(req: Request, res: Response) {
  const { q, ids } = req.query as unknown as { q: string; ids: string };
  const selected = ids.split(",").filter(Boolean);
  // ponytail: search returns 50 listings and 100 communities; paginate these selectors if catalog size makes the cap visible.
  const [selectedProducts, matchingProducts, communities] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where: { ...publicProductWhere, id: { in: selected } }, select: { id: true, name: true, slug: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 50 }),
    prisma.marketplaceProduct.findMany({ where: { ...publicProductWhere, name: { contains: q, mode: "insensitive" } }, select: { id: true, name: true, slug: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 50 }),
    prisma.marketplaceCommunity.findMany({ where: { state: "ACTIVE" }, select: { slug: true, nameEn: true, nameFa: true }, orderBy: { nameEn: "asc" }, take: 100 }),
  ]);
  res.set("Cache-Control", "private, no-store");
  const selectedIds = new Set(selectedProducts.map((product) => product.id));
  res.json({ data: { products: [...selectedProducts, ...matchingProducts.filter((product) => !selectedIds.has(product.id))], communities } });
}

export async function saveManagedCuratedCollection(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const { productIds, communitySlug, ...content } = req.body as { productIds: string[]; communitySlug: string | null; scope: "STAFF" | "COMMUNITY"; titleEn: string; titleFa: string | null; descriptionEn: string; descriptionFa: string | null; published: boolean; position: number };
  const administrator = res.locals.reader.marketplaceRoles.includes("administrator");
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${slug}, 8))`;
    const existing = await tx.marketplaceCuratedCollection.findUnique({ where: { slug }, select: { id: true, scope: true } });
    if ((content.scope === "STAFF" || existing?.scope === "STAFF") && !administrator)
      throw new MarketplaceRequestError(403, "ADMINISTRATOR_REQUIRED", "Staff collections require an administrator");
    const community = communitySlug ? await tx.marketplaceCommunity.findFirst({ where: { slug: communitySlug, state: "ACTIVE" }, select: { id: true } }) : null;
    if (content.scope === "COMMUNITY" && !community) throw new MarketplaceRequestError(404, "COMMUNITY_NOT_FOUND", "Active community not found");
    const eligible = await tx.marketplaceProduct.count({ where: { id: { in: productIds }, ...publicProductWhere, ...(community ? { communityPlacements: { some: { ...publicPlacementWhere, communityId: community.id } } } : {}) } });
    if (eligible !== productIds.length) throw new MarketplaceRequestError(400, "LISTING_NOT_ELIGIBLE", "Collections may include only public listings eligible for their community");
    if (!existing && await tx.marketplaceCuratedCollection.count() >= 100) throw new MarketplaceRequestError(409, "COLLECTION_LIMIT", "Collection limit reached");
    const collection = await tx.marketplaceCuratedCollection.upsert({
      where: { slug },
      create: { slug, ...content, communityId: community?.id ?? null, curatorUserId: res.locals.reader.id as string },
      update: { ...content, communityId: community?.id ?? null, curatorUserId: res.locals.reader.id as string },
    });
    await tx.marketplaceCuratedCollectionItem.deleteMany({ where: { collectionId: collection.id } });
    if (productIds.length) await tx.marketplaceCuratedCollectionItem.createMany({ data: productIds.map((productId, position) => ({ collectionId: collection.id, productId, position })) });
    return { slug: collection.slug };
  });
  res.json({ data: result });
}
