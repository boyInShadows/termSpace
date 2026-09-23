import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { marketplaceItemTypeKey } from "../lib/marketplaceManifest.js";

const creatorProfileSelect = {
  id: true,
  name: true,
  handle: true,
  initials: true,
  verified: true,
  bio: true,
  followers: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

const creatorDashboardListingSelect = {
  id: true,
  slug: true,
  name: true,
  itemType: true,
  type: true,
  lifecycleState: true,
  lifecycleVersion: true,
  published: true,
  rating: true,
  reviewCount: true,
  version: true,
  updatedAt: true,
  versions: {
    orderBy: { releasedAt: "desc" as const },
    take: 1,
    select: { version: true, releasedAt: true },
  },
  lifecycleEvents: {
    where: { action: { not: "INTERNAL_NOTE_ADDED" as const } },
    orderBy: { createdAt: "desc" as const },
    take: 3,
    select: { id: true, action: true, resultingState: true, publicReason: true, createdAt: true },
  },
  _count: {
    select: {
      versions: true,
      orders: { where: { status: "completed" } },
    },
  },
} satisfies Prisma.MarketplaceProductSelect;

type CreatorDashboardListingRecord = Prisma.MarketplaceProductGetPayload<{ select: typeof creatorDashboardListingSelect }>;

function serializeDashboardListing(
  product: CreatorDashboardListingRecord,
  feedback: { action: string; reasonCode: string; publicReason: string | null; createdAt: Date } | undefined,
) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    typeKey: marketplaceItemTypeKey(product.itemType),
    state: product.lifecycleState.toLowerCase(),
    lifecycleVersion: product.lifecycleVersion,
    published: product.published,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    acquisitionCount: product._count.orders,
    currentVersion: product.version,
    releaseCount: product._count.versions,
    latestRelease: product.versions[0] ?? null,
    moderationFeedback: feedback ? {
      action: feedback.action.toLowerCase(),
      reasonCode: feedback.reasonCode,
      message: feedback.publicReason,
      createdAt: feedback.createdAt,
    } : null,
    recentUpdates: product.lifecycleEvents.map((event) => ({
      id: event.id,
      action: event.action.toLowerCase(),
      state: event.resultingState.toLowerCase(),
      message: event.publicReason,
      createdAt: event.createdAt,
    })),
    updatedAt: product.updatedAt,
  };
}

function serializeCreatorProfile(creator: {
  _count: { products: number };
  [key: string]: unknown;
}, accessActive = true) {
  const { _count, ...profile } = creator;
  return { ...profile, products: _count.products, accessActive };
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0] ?? "").join("").toUpperCase();
}

class CreatorRoleRevokedError extends Error {}

export async function getOwnedCreatorProfile(_req: Request, res: Response) {
  const creator = await prisma.marketplaceCreator.findUnique({
    where: { ownerUserId: res.locals.reader.id as string },
    select: creatorProfileSelect,
  });
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Create your creator profile to get started" } });
    return;
  }
  res.json({ data: serializeCreatorProfile(creator, res.locals.reader.marketplaceRoles.includes("creator")) });
}

export async function createOwnedCreatorProfile(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  try {
    const creator = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 1))`;
      const [existingCreator, roleGrant] = await Promise.all([
        tx.marketplaceCreator.findUnique({ where: { ownerUserId: userId }, select: { id: true } }),
        tx.marketplaceRoleGrant.findUnique({ where: { userId_role: { userId, role: "CREATOR" } }, select: { revokedAt: true } }),
      ]);
      if (existingCreator) return null;
      if (roleGrant?.revokedAt) throw new CreatorRoleRevokedError();

      const created = await tx.marketplaceCreator.create({
        data: {
          ownerUserId: userId,
          name: req.body.name,
          handle: req.body.handle,
          bio: req.body.bio,
          initials: initialsFor(req.body.name),
        },
        select: creatorProfileSelect,
      });
      if (!roleGrant) {
        const correlationId = randomUUID();
        await tx.marketplaceRoleGrant.create({ data: { userId, role: "CREATOR" } });
        await tx.marketplaceRoleEvent.create({
          data: { subjectUserId: userId, role: "CREATOR", action: "GRANTED", actor: `reader:${userId}`, reason: "Self-service creator onboarding", correlationId },
        });
      }
      return created;
    });
    if (!creator) {
      res.status(409).json({ error: { code: "CREATOR_PROFILE_EXISTS", message: "This account already has a creator profile" } });
      return;
    }
    res.status(201).json({ data: serializeCreatorProfile(creator) });
  } catch (error) {
    if (error instanceof CreatorRoleRevokedError) {
      res.status(403).json({ error: { code: "CREATOR_ACCESS_REVOKED", message: "Creator access was revoked; contact support before onboarding" } });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String).join(",") : String(error.meta?.target ?? "");
      const handleConflict = target.includes("handle");
      res.status(409).json({ error: { code: handleConflict ? "CREATOR_HANDLE_TAKEN" : "CREATOR_PROFILE_EXISTS", message: handleConflict ? "That creator handle is already taken" : "This account already has a creator profile" } });
      return;
    }
    throw error;
  }
}

export async function updateOwnedCreatorProfile(req: Request, res: Response) {
  const existing = await prisma.marketplaceCreator.findUnique({
    where: { ownerUserId: res.locals.reader.id as string },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Creator profile not found" } });
    return;
  }
  const creator = await prisma.marketplaceCreator.update({
    where: { id: existing.id },
    data: { name: req.body.name, bio: req.body.bio, initials: initialsFor(req.body.name) },
    select: creatorProfileSelect,
  });
  res.json({ data: serializeCreatorProfile(creator) });
}

/** The dashboard's acquisition window and the one before it it is compared with. */
const ACQUISITION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Average rating across a creator's listings, weighted by review count so one
 * listing with a single five-star review cannot outweigh one with two hundred.
 * `null` when nothing has been reviewed — a zero would read as a bad score.
 */
function reviewWeightedRating(listings: Array<{ rating: Prisma.Decimal | number; reviewCount: number }>) {
  const reviewCount = listings.reduce((sum, listing) => sum + listing.reviewCount, 0);
  if (reviewCount === 0) return { averageRating: null, ratedReviewCount: 0 };
  const weighted = listings.reduce((sum, listing) => sum + Number(listing.rating) * listing.reviewCount, 0);
  return { averageRating: Math.round((weighted / reviewCount) * 10) / 10, ratedReviewCount: reviewCount };
}

export async function getCreatorDashboard(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const ownerWhere = { creator: { ownerUserId: userId } } as const;
  const completedOrders = { status: "completed", product: ownerWhere } as const;
  const now = Date.now();
  const weekStart = new Date(now - ACQUISITION_WINDOW_MS);
  const previousWeekStart = new Date(now - 2 * ACQUISITION_WINDOW_MS);
  const [
    listings, total, publishedListings, inReviewListings, totalAcquisitions,
    acquisitionsLast7Days, acquisitionsPrevious7Days, ratedListings,
  ] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where: ownerWhere,
      select: creatorDashboardListingSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceProduct.count({ where: ownerWhere }),
    prisma.marketplaceProduct.count({ where: { ...ownerWhere, published: true } }),
    prisma.marketplaceProduct.count({ where: { ...ownerWhere, lifecycleState: { in: ["SUBMITTED", "APPROVED"] } } }),
    prisma.marketplaceOrder.count({ where: completedOrders }),
    prisma.marketplaceOrder.count({ where: { ...completedOrders, createdAt: { gte: weekStart } } }),
    prisma.marketplaceOrder.count({ where: { ...completedOrders, createdAt: { gte: previousWeekStart, lt: weekStart } } }),
    // Every rated listing, not just this page: the average covers the whole
    // catalogue, and is bounded by one creator's listing count.
    prisma.marketplaceProduct.findMany({
      where: { ...ownerWhere, reviewCount: { gt: 0 } },
      select: { rating: true, reviewCount: true },
    }),
  ]);

  const listingIds = listings.map((listing) => listing.id);
  const feedbackEvents = listingIds.length ? await prisma.marketplaceListingLifecycleEvent.findMany({
    where: {
      productId: { in: listingIds },
      product: ownerWhere,
      publicReason: { not: null },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    distinct: ["productId"],
    select: { productId: true, action: true, reasonCode: true, publicReason: true, createdAt: true },
  }) : [];
  const feedbackByProduct = new Map(feedbackEvents.map((event) => [event.productId, event]));

  res.json({
    data: {
      summary: {
        totalListings: total, publishedListings, inReviewListings, totalAcquisitions,
        acquisitionsLast7Days, acquisitionsPrevious7Days,
        ...reviewWeightedRating(ratedListings),
      },
      listings: listings.map((listing) => serializeDashboardListing(listing, feedbackByProduct.get(listing.id))),
    },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function listOwnedMarketplaceReleases(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      slug: true,
      name: true,
      lifecycleState: true,
      lifecycleVersion: true,
      published: true,
      approvedSnapshotId: true,
      proposedSnapshotId: true,
      creator: { select: { ownerUserId: true } },
      versions: {
        orderBy: [{ releasedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          version: true,
          notes: true,
          releasedAt: true,
          releaseManifests: {
            orderBy: { revision: "desc" },
            select: {
              id: true,
              revision: true,
              sourceKind: true,
              sourceUrl: true,
              sourceRef: true,
              sourcePath: true,
              providerIntegrityDigest: true,
              artifactSizeBytes: true,
              resolvedInstallationUrl: true,
              sourceResolvedAt: true,
              ownershipVerifiedAt: true,
              sourceCheckStatus: true,
              sourceCheckedAt: true,
              sourceNextCheckAt: true,
              sourceFailureCount: true,
              lastSourceErrorCode: true,
              publishedAt: true,
              createdAt: true,
              listingSnapshots: { select: { id: true, revision: true } },
              _count: { select: { acquisitions: true } },
            },
          },
        },
      },
    },
  });
  if (!product || product.creator.ownerUserId !== res.locals.reader.id) {
    res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Marketplace listing not found" } });
    return;
  }

  res.json({ data: {
    listing: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      state: product.lifecycleState.toLowerCase(),
      lifecycleVersion: product.lifecycleVersion,
      published: product.published,
    },
    releases: product.versions.flatMap((version) => version.releaseManifests.map((release) => {
      const snapshot = release.listingSnapshots[0] ?? null;
      const isApproved = snapshot?.id === product.approvedSnapshotId;
      const isProposed = snapshot?.id === product.proposedSnapshotId;
      return {
        id: release.id,
        productVersionId: version.id,
        version: version.version,
        notes: version.notes,
        revision: release.revision,
        status: release.publishedAt ? "published" : isProposed ? "proposed" : "superseded_draft",
        source: {
          kind: release.sourceKind.toLowerCase(),
          url: release.sourceUrl,
          ref: release.sourceRef,
          path: release.sourcePath,
          integrityDigest: release.providerIntegrityDigest,
          artifactSizeBytes: release.artifactSizeBytes,
          installationUrl: release.resolvedInstallationUrl,
        },
        sourceCheckStatus: release.sourceCheckStatus.toLowerCase(),
        sourceCheckedAt: release.sourceCheckedAt,
        sourceNextCheckAt: release.sourceNextCheckAt,
        sourceFailureCount: release.sourceFailureCount,
        lastSourceErrorCode: release.lastSourceErrorCode,
        sourceResolvedAt: release.sourceResolvedAt,
        ownershipVerifiedAt: release.ownershipVerifiedAt,
        publishedAt: release.publishedAt,
        createdAt: release.createdAt,
        listingRevision: snapshot?.revision ?? null,
        isCurrent: isApproved,
        acquisitionCount: release._count.acquisitions,
      };
    })),
  } });
}
