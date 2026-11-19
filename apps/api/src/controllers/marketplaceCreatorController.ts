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
  avatarUrl: true,
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
  lifecycleResumeState: true,
  lifecycleResumePublished: true,
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
    where: { action: { notIn: ["INTERNAL_NOTE_ADDED", "FEATURED", "UNFEATURED"] as ("INTERNAL_NOTE_ADDED" | "FEATURED" | "UNFEATURED")[] } },
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

const RECENT_REVIEWS_PER_LISTING = 3;
const REVIEW_EXCERPT_LENGTH = 280;
const ACQUISITION_TREND_DAYS = 30;

type DashboardReview = { id: string; author: string; rating: number; body: string; createdAt: Date };
type DashboardListingStats = {
  acquisitionsLast30Days: number;
  recentReviews: DashboardReview[];
  viewsLast30Days: number;
  viewsDaily: number[];
};

/** The reader's own words are already public on the listing; the studio shows an excerpt. */
const reviewExcerpt = (body: string) => body.length > REVIEW_EXCERPT_LENGTH ? `${body.slice(0, REVIEW_EXCERPT_LENGTH - 1).trimEnd()}…` : body;

function serializeDashboardListing(
  product: CreatorDashboardListingRecord,
  feedback: { action: string; reasonCode: string; publicReason: string | null; createdAt: Date } | undefined,
  archivedBy: string | undefined,
  stats: DashboardListingStats,
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
    restoreTarget: product.lifecycleState === "ARCHIVED" && archivedBy === "CREATOR"
      && product.lifecycleResumeState && product.lifecycleResumePublished !== null
      ? { state: product.lifecycleResumeState.toLowerCase(), published: product.lifecycleResumePublished } : null,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    acquisitionCount: product._count.orders,
    acquisitionsLast30Days: stats.acquisitionsLast30Days,
    // Total views and one entry per day, oldest first; daily totals, never visitors.
    viewsLast30Days: stats.viewsLast30Days,
    viewsDaily: stats.viewsDaily,
    recentReviews: stats.recentReviews.map((review) => ({ id: review.id, author: review.author, rating: review.rating, body: reviewExcerpt(review.body), createdAt: review.createdAt })),
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
    data: { name: req.body.name, bio: req.body.bio, initials: initialsFor(req.body.name), ...(req.body.avatarUrl !== undefined && { avatarUrl: req.body.avatarUrl }) },
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
  const archivedIds = listings.filter((listing) => listing.lifecycleState === "ARCHIVED").map((listing) => listing.id);
  const archiveEvents = archivedIds.length ? await prisma.marketplaceListingLifecycleEvent.findMany({
    where: { productId: { in: archivedIds }, product: ownerWhere, action: "ARCHIVED" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    distinct: ["productId"],
    select: { productId: true, actorType: true },
  }) : [];
  const archivedByProduct = new Map(archiveEvents.map((event) => [event.productId, event.actorType]));

  // All of these read only the listings selected above, which are already this creator's.
  const trendStart = new Date(now - ACQUISITION_TREND_DAYS * 24 * 60 * 60 * 1000);
  // Exactly the last 30 UTC calendar days, today last, so the series has a fixed length.
  const today = new Date(now);
  const viewDays = Array.from({ length: ACQUISITION_TREND_DAYS }, (_, index) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (ACQUISITION_TREND_DAYS - 1 - index))));
  const viewStart = viewDays[0];
  const [trendCounts, reviewsPerListing, viewTotals, viewRows] = listingIds.length ? await Promise.all([
    prisma.marketplaceOrder.groupBy({ by: ["productId"], where: { productId: { in: listingIds }, status: "completed", createdAt: { gte: trendStart } }, _count: { _all: true } }),
    Promise.all(listingIds.map((productId) => prisma.marketplaceReview.findMany({
      where: { productId, published: true, hiddenAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RECENT_REVIEWS_PER_LISTING,
      select: { id: true, author: true, rating: true, body: true, createdAt: true },
    }))),
    prisma.marketplaceListingViewDaily.groupBy({ by: ["productId"], where: { productId: { in: listingIds }, day: { gte: viewStart } }, _sum: { views: true } }),
    prisma.marketplaceListingViewDaily.findMany({ where: { productId: { in: listingIds }, day: { gte: viewStart } }, select: { productId: true, day: true, views: true } }),
  ]) : [[], [], [], []];
  const trendByProduct = new Map(trendCounts.map((row) => [row.productId, row._count._all]));
  const reviewsByProduct = new Map(listingIds.map((productId, index) => [productId, reviewsPerListing[index]]));
  const viewsByProduct = new Map(viewTotals.map((row) => [row.productId, row._sum.views ?? 0]));
  const seriesByProduct = new Map(listingIds.map((productId) => [productId, Array<number>(ACQUISITION_TREND_DAYS).fill(0)]));
  for (const row of viewRows) {
    const series = seriesByProduct.get(row.productId);
    const dayIndex = viewDays.findIndex((day) => day.getTime() === row.day.getTime());
    if (series && dayIndex >= 0) series[dayIndex] = row.views;
  }

  res.json({
    data: {
      summary: {
        totalListings: total, publishedListings, inReviewListings, totalAcquisitions,
        acquisitionsLast7Days, acquisitionsPrevious7Days,
        ...reviewWeightedRating(ratedListings),
      },
      listings: listings.map((listing) => serializeDashboardListing(listing, feedbackByProduct.get(listing.id), archivedByProduct.get(listing.id), {
        acquisitionsLast30Days: trendByProduct.get(listing.id) ?? 0,
        recentReviews: reviewsByProduct.get(listing.id) ?? [],
        viewsLast30Days: viewsByProduct.get(listing.id) ?? 0,
        viewsDaily: seriesByProduct.get(listing.id) ?? Array<number>(ACQUISITION_TREND_DAYS).fill(0),
      })),
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
