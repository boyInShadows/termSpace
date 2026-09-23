import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { marketplaceItemTypeKey } from "../lib/marketplaceManifest.js";

const reviewStates = ["SUBMITTED", "APPROVED"] as const;
const stateMap = {
  draft: "DRAFT", submitted: "SUBMITTED", changes_requested: "CHANGES_REQUESTED", approved: "APPROVED",
  published: "PUBLISHED", rejected: "REJECTED", suspended: "SUSPENDED", archived: "ARCHIVED",
} as const;

function queueStateWhere(state: string) {
  if (state === "all") return {};
  if (state === "review") return { lifecycleState: { in: [...reviewStates] } };
  return { lifecycleState: stateMap[state as keyof typeof stateMap] };
}

export async function listMarketplaceModerationQueue(req: Request, res: Response) {
  const { state, q, page, limit } = req.query as unknown as { state: string; q: string; page: number; limit: number };
  const userId = res.locals.reader.id as string;
  const where: Prisma.MarketplaceProductWhereInput = {
    NOT: { creator: { ownerUserId: userId } },
    ...queueStateWhere(state),
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { creator: { name: { contains: q, mode: "insensitive" } } },
      { creator: { handle: { contains: q, mode: "insensitive" } } },
    ] } : {}),
  };
  const [products, total, submitted, approved] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where,
      select: {
        id: true, slug: true, name: true, itemType: true, type: true, lifecycleState: true,
        lifecycleVersion: true, published: true, updatedAt: true,
        creator: { select: { name: true, handle: true, ownerUserId: true } },
        proposedSnapshot: { select: {
          revision: true, createdAt: true,
          releaseManifest: { select: { sourceResolvedAt: true, ownershipVerifiedAt: true, sourceCheckStatus: true, productVersion: { select: { version: true } } } },
          _count: { select: { communityRequests: true } },
        } },
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceProduct.count({ where }),
    prisma.marketplaceProduct.count({ where: { lifecycleState: "SUBMITTED", NOT: { creator: { ownerUserId: userId } } } }),
    prisma.marketplaceProduct.count({ where: { lifecycleState: "APPROVED", NOT: { creator: { ownerUserId: userId } } } }),
  ]);
  res.json({
    data: {
      summary: { submitted, approved, awaitingAction: submitted + approved },
      listings: products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        type: product.type,
        typeKey: marketplaceItemTypeKey(product.itemType),
        state: product.lifecycleState.toLowerCase(),
        version: product.lifecycleVersion,
        published: product.published,
        creator: { name: product.creator.name, handle: product.creator.handle },
        selfOwned: product.creator.ownerUserId === userId,
        proposedRevision: product.proposedSnapshot?.revision ?? null,
        releaseVersion: product.proposedSnapshot?.releaseManifest?.productVersion.version ?? null,
        sourceResolved: Boolean(product.proposedSnapshot?.releaseManifest?.sourceResolvedAt),
        ownershipVerified: Boolean(product.proposedSnapshot?.releaseManifest?.ownershipVerifiedAt && product.proposedSnapshot.releaseManifest.sourceCheckStatus === "VERIFIED"),
        communityRequestCount: product.proposedSnapshot?._count.communityRequests ?? 0,
        updatedAt: product.updatedAt,
      })),
    },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getMarketplaceModerationPreview(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true, slug: true, name: true, type: true, itemType: true, lifecycleState: true,
      lifecycleVersion: true, published: true, updatedAt: true,
      creator: { select: { id: true, name: true, handle: true, ownerUserId: true } },
      proposedSnapshot: { select: {
        id: true, revision: true, schemaVersion: true, digestSha256: true, content: true, createdAt: true,
        releaseManifest: { select: {
          id: true, sourceKind: true, sourceUrl: true, sourceRef: true, sourcePath: true,
          providerIntegrityDigest: true, sourceResolvedAt: true, ownershipVerifiedAt: true, sourceCheckStatus: true,
          sourceCheckedAt: true, lastSourceErrorCode: true, publishedAt: true,
        } },
        communityRequests: { select: {
          communityId: true, createdAt: true,
          community: { select: { slug: true, nameEn: true, nameFa: true, primaryPlatform: true, rulesEn: true, rulesFa: true } },
        }, orderBy: { createdAt: "asc" } },
      } },
      approvedSnapshot: { select: { id: true, revision: true, content: true, createdAt: true } },
      communityPlacements: { select: { id: true, communityId: true, state: true, version: true, publicReason: true } },
      lifecycleEvents: {
        select: {
          id: true, previousState: true, resultingState: true, action: true, actorType: true,
          actorUserId: true, reasonCode: true, publicReason: true, internalNote: true,
          correlationId: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 101,
      },
    },
  });
  if (!product) {
    res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Marketplace listing not found" } });
    return;
  }
  if (product.creator.ownerUserId === res.locals.reader.id) {
    res.status(403).json({ error: { code: "SELF_MODERATION_FORBIDDEN", message: "Staff cannot review a listing they own" } });
    return;
  }
  res.json({ data: {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    typeKey: marketplaceItemTypeKey(product.itemType),
    state: product.lifecycleState.toLowerCase(),
    version: product.lifecycleVersion,
    published: product.published,
    updatedAt: product.updatedAt,
    selfOwned: product.creator.ownerUserId === res.locals.reader.id,
    creator: { id: product.creator.id, name: product.creator.name, handle: product.creator.handle },
    proposedSnapshot: product.proposedSnapshot ? {
      ...product.proposedSnapshot,
      communityRequests: product.proposedSnapshot.communityRequests.map((request) => ({
        createdAt: request.createdAt,
        community: request.community,
        placement: (product.communityPlacements ?? []).find((placement) => placement.communityId === request.communityId) ?? null,
      })),
    } : null,
    approvedSnapshot: product.approvedSnapshot,
    auditTrail: product.lifecycleEvents.slice(0, 100).map((event) => ({
      ...event,
      previousState: event.previousState?.toLowerCase() ?? null,
      resultingState: event.resultingState.toLowerCase(),
      action: event.action.toLowerCase(),
      actorType: event.actorType.toLowerCase(),
    })),
    auditTrailTruncated: product.lifecycleEvents.length > 100,
  } });
}

export async function addMarketplaceModerationNote(req: Request, res: Response) {
  const productId = String(req.params.id);
  const userId = res.locals.reader.id as string;
  const actorType = res.locals.reader.marketplaceRoles.includes("administrator") ? "ADMINISTRATOR" : "MODERATOR";
  const correlationId = randomUUID();
  try {
    const note = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 2))`;
      const product = await tx.marketplaceProduct.findUnique({
        where: { id: productId },
        select: {
          id: true, lifecycleState: true, lifecycleVersion: true, proposedSnapshotId: true, approvedSnapshotId: true,
          creator: { select: { ownerUserId: true } },
        },
      });
      if (!product) throw new ModerationRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      if (product.creator.ownerUserId === userId) throw new ModerationRequestError(403, "SELF_MODERATION_FORBIDDEN", "Staff cannot moderate a listing they own");
      if (product.lifecycleVersion !== req.body.expectedVersion) throw new ModerationRequestError(409, "LISTING_VERSION_CONFLICT", "The listing changed; reload it before adding a note");
      return tx.marketplaceListingLifecycleEvent.create({
        data: {
          productId,
          snapshotId: product.proposedSnapshotId ?? product.approvedSnapshotId,
          previousState: product.lifecycleState,
          resultingState: product.lifecycleState,
          action: "INTERNAL_NOTE_ADDED",
          actorType,
          actorUserId: userId,
          reasonCode: "INTERNAL_NOTE_ADDED",
          internalNote: req.body.note,
          correlationId,
        },
        select: { id: true, createdAt: true },
      });
    });
    res.status(201).json({ data: { ...note, correlationId } });
  } catch (error) {
    if (error instanceof ModerationRequestError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    throw error;
  }
}

const placementDecision = {
  APPROVE: { state: "APPROVED", action: "APPROVED" },
  REJECT: { state: "REJECTED", action: "REJECTED" },
  REMOVE: { state: "REMOVED", action: "REMOVED" },
} as const;

export async function moderateMarketplaceCommunityPlacement(req: Request, res: Response) {
  const productId = String(req.params.id);
  const communitySlug = String(req.params.communitySlug);
  const userId = res.locals.reader.id as string;
  const actorType = res.locals.reader.marketplaceRoles.includes("administrator") ? "ADMINISTRATOR" : "MODERATOR";
  const decision = placementDecision[req.body.action as keyof typeof placementDecision];
  const correlationId = randomUUID();
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${productId}:${communitySlug}`}, 3))`;
      const community = await tx.marketplaceCommunity.findUnique({ where: { slug: communitySlug }, select: { id: true, state: true } });
      if (!community) throw new ModerationRequestError(404, "PLACEMENT_NOT_FOUND", "Community placement request not found");
      const placement = await tx.marketplaceCommunityPlacement.findUnique({
        where: { productId_communityId: { productId, communityId: community.id } },
        select: {
          id: true, state: true, version: true, requestedSnapshotId: true,
          product: { select: { creator: { select: { ownerUserId: true } } } },
        },
      });
      if (!placement) throw new ModerationRequestError(404, "PLACEMENT_NOT_FOUND", "Community placement request not found");
      if (placement.product.creator.ownerUserId === userId) throw new ModerationRequestError(403, "SELF_MODERATION_FORBIDDEN", "Staff cannot moderate their own community placement");
      if (placement.version !== req.body.expectedVersion) throw new ModerationRequestError(409, "PLACEMENT_VERSION_CONFLICT", "The community placement changed; reload it before deciding");
      if (req.body.action === "APPROVE" && community.state !== "ACTIVE") throw new ModerationRequestError(409, "COMMUNITY_ARCHIVED", "Archived communities cannot accept placements");
      const requiredState = req.body.action === "REMOVE" ? "APPROVED" : "REQUESTED";
      if (placement.state !== requiredState) throw new ModerationRequestError(409, "PLACEMENT_TRANSITION_INVALID", `A ${placement.state.toLowerCase()} placement cannot be ${req.body.action.toLowerCase()}d`);

      const next = await tx.marketplaceCommunityPlacement.update({
        where: { id: placement.id },
        data: {
          state: decision.state,
          version: { increment: 1 },
          moderatedByUserId: userId,
          decidedAt: new Date(),
          publicReason: req.body.publicReason ?? null,
        },
        select: { id: true, state: true, version: true, publicReason: true, decidedAt: true },
      });
      await tx.marketplaceCommunityPlacementEvent.create({
        data: {
          placementId: placement.id,
          snapshotId: placement.requestedSnapshotId,
          previousState: placement.state,
          resultingState: decision.state,
          action: decision.action,
          actorType,
          actorUserId: userId,
          publicReason: req.body.publicReason,
          internalNote: req.body.internalNote,
          correlationId,
        },
      });
      return next;
    });
    res.json({ data: { ...updated, state: updated.state.toLowerCase(), correlationId } });
  } catch (error) {
    if (error instanceof ModerationRequestError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    throw error;
  }
}

class ModerationRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
