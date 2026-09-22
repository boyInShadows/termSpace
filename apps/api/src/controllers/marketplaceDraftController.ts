import { randomUUID } from "node:crypto";
import { MarketplaceListingState, Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createDraftReleaseManifest, PublishedVersionConflictError } from "../lib/marketplaceDraftPersistence.js";
import {
  MARKETPLACE_DATABASE_ITEM_TYPES,
  type MarketplaceManifestV1,
  validateMarketplaceManifest,
} from "../lib/marketplaceManifest.js";
import { marketplaceProductProjectionFromManifest } from "../lib/marketplaceListingLifecycle.js";

class DraftRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

const editableStates = new Set(["DRAFT", "CHANGES_REQUESTED", "REJECTED", "PUBLISHED"]);

function releaseSignature(manifest: MarketplaceManifestV1) {
  return JSON.stringify({ type: manifest.type, release: manifest.release, typeDetails: manifest.typeDetails });
}

async function resolveDraftReferences(tx: Prisma.TransactionClient, manifest: MarketplaceManifestV1) {
  const [category, communities] = await Promise.all([
    tx.marketplaceCategory.findUnique({ where: { slug: manifest.listing.categorySlug }, select: { id: true } }),
    tx.marketplaceCommunity.findMany({
      where: { slug: { in: manifest.listing.communitySlugs }, state: "ACTIVE" },
      select: { id: true, slug: true },
    }),
  ]);
  if (!category) throw new DraftRequestError(409, "CATEGORY_NOT_FOUND", "The selected category is unavailable");
  if (communities.length !== manifest.listing.communitySlugs.length) {
    throw new DraftRequestError(409, "COMMUNITY_NOT_FOUND", "One or more selected communities are unavailable");
  }
  return { categoryId: category.id, communities };
}

async function saveDraftRevision(input: {
  tx: Prisma.TransactionClient;
  product: {
    id: string;
    published: boolean;
    lifecycleState: string;
    lifecycleVersion: number;
    approvedSnapshot: { content: Prisma.JsonValue; releaseManifestId: string | null } | null;
  };
  manifest: MarketplaceManifestV1;
  snapshot: object;
  digestSha256: string;
  categoryId: string;
  communities: Array<{ id: string; slug: string }>;
  userId: string;
}) {
  const { tx, product, manifest, snapshot, digestSha256, categoryId, communities, userId } = input;
  const latest = await tx.marketplaceListingSnapshot.aggregate({ where: { productId: product.id }, _max: { revision: true } });
  const revision = (latest._max.revision ?? 0) + 1;
  const manifestSnapshot = await tx.marketplaceManifestSnapshot.create({
    data: {
      productId: product.id,
      manifestVersion: manifest.manifestVersion,
      itemType: MARKETPLACE_DATABASE_ITEM_TYPES[manifest.type],
      digestSha256,
      snapshot,
    },
    select: { id: true },
  });

  let releaseManifestId: string | null = null;
  if (product.approvedSnapshot?.releaseManifestId) {
    try {
      const approvedManifest = validateMarketplaceManifest(product.approvedSnapshot.content).manifest;
      if (releaseSignature(approvedManifest) === releaseSignature(manifest)) {
        releaseManifestId = product.approvedSnapshot.releaseManifestId;
      }
    } catch {
      // Legacy approved snapshots intentionally have no modern release contract.
    }
  }
  releaseManifestId ??= await createDraftReleaseManifest(tx, product.id, manifest);

  const listingSnapshot = await tx.marketplaceListingSnapshot.create({
    data: {
      productId: product.id,
      manifestSnapshotId: manifestSnapshot.id,
      releaseManifestId,
      revision,
      schemaVersion: manifest.manifestVersion,
      digestSha256,
      content: snapshot,
      createdByActor: `reader:${userId}`,
    },
    select: { id: true, revision: true, createdAt: true },
  });
  if (communities.length) {
    await tx.marketplaceCommunityPlacementRequest.createMany({
      data: communities.map((community) => ({
        snapshotId: listingSnapshot.id,
        communityId: community.id,
        productId: product.id,
        requestedByUserId: userId,
      })),
    });
  }

  const projection = marketplaceProductProjectionFromManifest(manifest, categoryId);
  const updated = await tx.marketplaceProduct.update({
    where: { id: product.id },
    data: {
      lifecycleState: "DRAFT",
      lifecycleVersion: { increment: 1 },
      proposedSnapshotId: listingSnapshot.id,
      ...(product.published ? {} : projection),
    },
    select: { id: true, slug: true, name: true, lifecycleState: true, lifecycleVersion: true, published: true },
  });
  await tx.marketplaceListingLifecycleEvent.create({
    data: {
      productId: product.id,
      snapshotId: listingSnapshot.id,
      previousState: product.lifecycleState as MarketplaceListingState,
      resultingState: "DRAFT",
      action: "DRAFT_SAVED",
      actorType: "CREATOR",
      actorUserId: userId,
      reasonCode: "CREATOR_DRAFT_SAVE",
      correlationId: randomUUID(),
    },
  });
  return { ...updated, snapshot: { ...listingSnapshot, content: snapshot } };
}

export async function createOwnedMarketplaceDraft(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const { manifest, snapshot, digestSha256 } = validateMarketplaceManifest(req.body.manifest);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const creator = await tx.marketplaceCreator.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
      if (!creator) throw new DraftRequestError(404, "CREATOR_PROFILE_NOT_FOUND", "Creator profile not found");
      const references = await resolveDraftReferences(tx, manifest);
      const projection = marketplaceProductProjectionFromManifest(manifest, references.categoryId);
      const product = await tx.marketplaceProduct.create({
        data: {
          ...projection,
          creatorId: creator.id,
          priceMinor: 0,
          pricingModel: "free",
          benefits: [],
          previewFiles: [],
          published: false,
        },
        select: { id: true, published: true, lifecycleState: true, lifecycleVersion: true },
      });
      return saveDraftRevision({ tx, product: { ...product, approvedSnapshot: null }, manifest, snapshot, digestSha256, ...references, userId });
    });
    res.status(201).json({ data: serializeDraft(result) });
  } catch (error) {
    handleDraftError(error, res);
  }
}

export async function updateOwnedMarketplaceDraft(req: Request, res: Response) {
  const productId = String(req.params.id);
  const userId = res.locals.reader.id as string;
  const { manifest, snapshot, digestSha256 } = validateMarketplaceManifest(req.body.manifest);
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 2))`;
      const product = await tx.marketplaceProduct.findUnique({
        where: { id: productId },
        select: {
          id: true, published: true, lifecycleState: true, lifecycleVersion: true,
          creator: { select: { ownerUserId: true } },
          approvedSnapshot: { select: { content: true, releaseManifestId: true } },
        },
      });
      if (!product || product.creator.ownerUserId !== userId) throw new DraftRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      if (product.lifecycleVersion !== req.body.expectedVersion) throw new DraftRequestError(409, "LISTING_VERSION_CONFLICT", "The listing changed; reload it before saving");
      if (!editableStates.has(product.lifecycleState)) throw new DraftRequestError(409, "DRAFT_EDIT_FORBIDDEN", "This listing must leave its current review state before it can be edited");
      const references = await resolveDraftReferences(tx, manifest);
      return saveDraftRevision({ tx, product, manifest, snapshot, digestSha256, ...references, userId });
    });
    res.json({ data: serializeDraft(result) });
  } catch (error) {
    handleDraftError(error, res);
  }
}

export async function getOwnedMarketplaceDraft(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true, slug: true, name: true, lifecycleState: true, lifecycleVersion: true, published: true,
      creator: { select: { ownerUserId: true } },
      proposedSnapshot: { select: { revision: true, content: true, createdAt: true } },
      approvedSnapshot: { select: { revision: true, content: true, createdAt: true } },
    },
  });
  if (!product || product.creator.ownerUserId !== res.locals.reader.id) {
    res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Marketplace listing not found" } });
    return;
  }
  const editableSnapshot = product.proposedSnapshot ?? product.approvedSnapshot;
  res.json({ data: {
    id: product.id,
    slug: product.slug,
    name: product.name,
    state: product.lifecycleState.toLowerCase(),
    version: product.lifecycleVersion,
    published: product.published,
    draft: editableSnapshot ? { revision: editableSnapshot.revision, content: editableSnapshot.content, savedAt: editableSnapshot.createdAt } : null,
  } });
}

export async function listMarketplaceDraftOptions(_req: Request, res: Response) {
  const [categories, communities] = await Promise.all([
    prisma.marketplaceCategory.findMany({ select: { slug: true, name: true }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    prisma.marketplaceCommunity.findMany({
      where: { state: "ACTIVE" },
      select: {
        slug: true, nameEn: true, nameFa: true, descriptionEn: true, descriptionFa: true,
        primaryPlatform: true, rulesEn: true, rulesFa: true, submissionGuidanceEn: true, submissionGuidanceFa: true,
      },
      orderBy: { nameEn: "asc" },
    }),
  ]);
  res.json({ data: { categories, communities } });
}

function serializeDraft(result: Awaited<ReturnType<typeof saveDraftRevision>>) {
  return {
    id: result.id,
    slug: result.slug,
    name: result.name,
    state: result.lifecycleState.toLowerCase(),
    version: result.lifecycleVersion,
    published: result.published,
    draft: { revision: result.snapshot.revision, content: result.snapshot.content, savedAt: result.snapshot.createdAt },
  };
}

function handleDraftError(error: unknown, res: Response) {
  if (error instanceof DraftRequestError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof PublishedVersionConflictError) {
    res.status(409).json({ error: { code: "VERSION_ALREADY_PUBLISHED", message: "Use a new version label when release metadata changes" } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: { code: "LISTING_CONFLICT", message: "The listing slug or release version is already in use" } });
    return;
  }
  throw error;
}
