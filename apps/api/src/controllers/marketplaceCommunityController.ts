import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { MarketplaceRequestError } from "../lib/marketplaceRequestError.js";
import {
  marketplacePlatforms,
  marketplaceModels,
} from "../lib/marketplaceCompatibility.js";
import {
  publicCommunitySelect,
  publicCreatorSelect,
  publicCreatorWhere,
  publicProductWhere,
} from "../lib/marketplaceVisibility.js";
import { productInclude, serializeProduct } from "./marketplaceController.js";

export async function getDiscoveryOptions(_req: Request, res: Response) {
  const [categories, communities] = await Promise.all([
    prisma.marketplaceCategory.findMany({
      select: { slug: true, name: true },
      orderBy: [{ position: "asc" }, { slug: "asc" }],
    }),
    prisma.marketplaceCommunity.findMany({
      where: { state: "ACTIVE" },
      select: publicCommunitySelect,
      orderBy: { slug: "asc" },
    }),
  ]);
  res.json({
    data: {
      platforms: marketplacePlatforms,
      models: marketplaceModels,
      categories,
      communities,
    },
  });
}

export async function getPublicCommunity(req: Request, res: Response) {
  const community = await prisma.marketplaceCommunity.findUnique({
    where: { slug: String(req.params.slug) },
    select: publicCommunitySelect,
  });
  if (!community)
    throw new MarketplaceRequestError(
      404,
      "COMMUNITY_NOT_FOUND",
      "Community not found",
    );
  res.json({ data: community });
}

export async function listManagedCommunities(_req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store");
  res.json({
    data: await prisma.marketplaceCommunity.findMany({
      select: publicCommunitySelect,
      orderBy: { slug: "asc" },
    }),
  });
}

export async function saveManagedCommunity(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const community = await prisma.marketplaceCommunity.upsert({
    where: { slug },
    create: { slug, ...req.body },
    update: req.body,
    select: publicCommunitySelect,
  });
  res.json({ data: community });
}

export async function listCommunityPlacements(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };
  const staff = req.path.startsWith("/moderation/");
  const where = staff
    ? { product: { NOT: { creator: { ownerUserId: res.locals.reader.id } } } }
    : { product: { creator: { ownerUserId: res.locals.reader.id } } };
  const [data, total] = await Promise.all([
    prisma.marketplaceCommunityPlacement.findMany({
      where,
      include: {
        community: { select: publicCommunitySelect },
        product: { select: { name: true, slug: true, published: true } },
      },
      orderBy: [{ requestedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceCommunityPlacement.count({ where }),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({
    data: data.map(
      ({ requestedByUserId, decidedByUserId, ...placement }) => placement,
    ),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function decideCommunityPlacement(req: Request, res: Response) {
  const id = String(req.params.id);
  const actorUserId = res.locals.reader.id as string;
  const { state, expectedVersion, publicReason, internalNote } = req.body;
  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.marketplaceCommunityPlacement.findUnique({
      where: { id },
      select: { productId: true },
    });
    if (!target)
      throw new MarketplaceRequestError(
        404,
        "PLACEMENT_NOT_FOUND",
        "Placement not found",
      );
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${target.productId}, 2))`;
    const placement = await tx.marketplaceCommunityPlacement.findUnique({
      where: { id },
      include: {
        community: true,
        product: {
          select: {
            creator: { select: { ownerUserId: true } },
            proposedSnapshotId: true,
            approvedSnapshotId: true,
            platforms: true,
          },
        },
      },
    });
    if (!placement)
      throw new MarketplaceRequestError(
        404,
        "PLACEMENT_NOT_FOUND",
        "Placement not found",
      );
    if (placement.product.creator.ownerUserId === actorUserId)
      throw new MarketplaceRequestError(
        403,
        "SELF_MODERATION_FORBIDDEN",
        "Staff cannot decide their own placement",
      );
    if (placement.version !== expectedVersion)
      throw new MarketplaceRequestError(
        409,
        "PLACEMENT_VERSION_CONFLICT",
        "Reload the placement before deciding it",
      );
    if (
      state === "APPROVED" &&
      (placement.community.state !== "ACTIVE" ||
        ![
          placement.product.proposedSnapshotId,
          placement.product.approvedSnapshotId,
        ].includes(placement.snapshotId))
    )
      throw new MarketplaceRequestError(
        409,
        "PLACEMENT_NOT_CURRENT",
        "The placement must reference a current listing snapshot in an active community",
      );
    const next = await tx.marketplaceCommunityPlacement.update({
      where: { id },
      data: {
        state,
        publicReason,
        decidedByUserId: actorUserId,
        decidedAt: new Date(),
        version: { increment: 1 },
        ...(state === "REMOVED"
          ? { approvedSnapshotId: null }
          : state === "APPROVED" &&
              placement.snapshotId === placement.product.approvedSnapshotId
            ? { approvedSnapshotId: placement.snapshotId }
            : {}),
      },
      select: { id: true, state: true, version: true, publicReason: true },
    });
    await tx.marketplacePlacementEvent.create({
      data: {
        placementId: id,
        actorUserId,
        state,
        publicReason,
        internalNote,
        correlationId: randomUUID(),
      },
    });
    return next;
  });
  res.json({ data: result });
}

export async function getPublicCreator(req: Request, res: Response) {
  const creator = await prisma.marketplaceCreator.findFirst({
    where: {
      ...publicCreatorWhere,
      handle: String(req.params.handle),
      products: { some: publicProductWhere },
    },
    select: publicCreatorSelect,
  });
  if (!creator)
    throw new MarketplaceRequestError(
      404,
      "CREATOR_NOT_FOUND",
      "Creator not found",
    );
  const collections = await prisma.marketplaceCollection.findMany({
    where: { creatorId: creator.id, published: true },
    select: {
      slug: true,
      title: true,
      description: true,
      _count: { select: { items: { where: { product: publicProductWhere } } } },
    },
    orderBy: { slug: "asc" },
    take: 100,
  });
  res.json({
    data: {
      ...creator,
      products: creator._count.products,
      _count: undefined,
      collections: collections.map(({ _count, ...collection }) => ({
        ...collection,
        count: _count.items,
      })),
    },
  });
}

export async function getPublicCollection(req: Request, res: Response) {
  const collection = await prisma.marketplaceCollection.findFirst({
    where: {
      slug: String(req.params.slug),
      published: true,
      creator: { ...publicCreatorWhere, handle: String(req.params.handle) },
    },
    select: {
      slug: true,
      title: true,
      description: true,
      creator: { select: publicCreatorSelect },
      items: {
        where: { product: publicProductWhere },
        include: { product: { include: productInclude } },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!collection)
    throw new MarketplaceRequestError(
      404,
      "COLLECTION_NOT_FOUND",
      "Collection not found",
    );
  res.json({
    data: {
      ...collection,
      creator: {
        ...collection.creator,
        _count: undefined,
        products: collection.creator._count.products,
      },
      items: collection.items.map((item) => serializeProduct(item.product)),
    },
  });
}

export async function listOwnedCollections(_req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store");
  res.json({
    data: await prisma.marketplaceCollection.findMany({
      where: { creator: { ownerUserId: res.locals.reader.id } },
      include: {
        items: { select: { productId: true }, orderBy: { position: "asc" } },
      },
      orderBy: { slug: "asc" },
      take: 100,
    }),
  });
}

export async function saveOwnedCollection(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const { productIds, ...content } = req.body as {
    productIds: string[];
    title: string;
    description: string;
    published: boolean;
  };
  const result = await prisma.$transaction(async (tx) => {
    const creator = await tx.marketplaceCreator.findUnique({
      where: { ownerUserId: res.locals.reader.id },
      select: { id: true },
    });
    if (!creator)
      throw new MarketplaceRequestError(
        404,
        "CREATOR_NOT_FOUND",
        "Creator not found",
      );
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${creator.id}, 4))`;
    const existing = await tx.marketplaceCollection.findUnique({
      where: { creatorId_slug: { creatorId: creator.id, slug } },
      select: { id: true },
    });
    // ponytail: bound profiles to 100 collections; paginate the public index if this limit grows.
    if (
      !existing &&
      (await tx.marketplaceCollection.count({
        where: { creatorId: creator.id },
      })) >= 100
    )
      throw new MarketplaceRequestError(
        409,
        "COLLECTION_LIMIT",
        "A creator can publish up to 100 collections",
      );
    const count = await tx.marketplaceProduct.count({
      where: { id: { in: productIds }, creatorId: creator.id },
    });
    if (count !== productIds.length)
      throw new MarketplaceRequestError(
        404,
        "LISTING_NOT_FOUND",
        "Collections can contain only listings you own",
      );
    const collection = await tx.marketplaceCollection.upsert({
      where: { creatorId_slug: { creatorId: creator.id, slug } },
      create: { creatorId: creator.id, slug, ...content },
      update: content,
    });
    await tx.marketplaceCollectionItem.deleteMany({
      where: { collectionId: collection.id },
    });
    if (productIds.length)
      await tx.marketplaceCollectionItem.createMany({
        data: productIds.map((productId, position) => ({
          collectionId: collection.id,
          productId,
          position,
        })),
      });
    return { slug: collection.slug };
  });
  res.json({ data: result });
}
