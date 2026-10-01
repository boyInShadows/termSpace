import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { Prisma, type MarketplaceTrustTarget } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { MarketplaceRequestError as RequestError } from "../lib/marketplaceRequestError.js";
import {
  activeRestrictions,
  publicCreatorWhere,
  publicPlacementWhere,
  publicProductWhere,
} from "../lib/marketplaceVisibility.js";

async function reportTarget(
  tx: Prisma.TransactionClient,
  targetType: MarketplaceTrustTarget,
  targetId: string,
) {
  const owner = { creator: { select: { ownerUserId: true } } } as const;
  if (targetType === "PRODUCT") {
    const product = await tx.marketplaceProduct.findFirst({
      where: { ...publicProductWhere, id: targetId },
      select: { id: true, ...owner },
    });
    if (product)
      return {
        productId: product.id,
        ownerUserId: product.creator.ownerUserId,
      };
  } else if (targetType === "RELEASE") {
    const release = await tx.marketplaceReleaseManifest.findFirst({
      where: {
        id: targetId,
        publishedAt: { not: null },
        productVersion: { product: publicProductWhere },
      },
      select: {
        id: true,
        productVersion: { select: { product: { select: owner } } },
      },
    });
    if (release)
      return {
        releaseId: release.id,
        ownerUserId: release.productVersion.product.creator.ownerUserId,
      };
  } else if (targetType === "PLACEMENT") {
    const placement = await tx.marketplaceCommunityPlacement.findFirst({
      where: { ...publicPlacementWhere, id: targetId },
      select: { id: true, product: { select: owner } },
    });
    if (placement)
      return {
        placementId: placement.id,
        ownerUserId: placement.product.creator.ownerUserId,
      };
  } else if (targetType === "CREATOR") {
    const creator = await tx.marketplaceCreator.findFirst({
      where: {
        ...publicCreatorWhere,
        id: targetId,
        products: { some: publicProductWhere },
      },
      select: { id: true, ownerUserId: true },
    });
    if (creator)
      return { creatorId: creator.id, ownerUserId: creator.ownerUserId };
  } else if (targetType === "REVIEW") {
    const review = await tx.marketplaceReview.findFirst({
      where: { id: targetId, published: true, product: publicProductWhere },
      select: { id: true },
    });
    if (review) return { reviewId: review.id };
  }
  throw new RequestError(
    404,
    "TARGET_NOT_FOUND",
    "Public report target not found",
  );
}

export async function reportMarketplaceTarget(req: Request, res: Response) {
  const { targetType, targetId, reason, explanation } = req.body;
  const reporterUserId = res.locals.reader.id as string;
  const result = await prisma.$transaction(async (tx) => {
    const dedupKey = `${targetType}:${targetId}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${dedupKey}, 5))`;
    const target = await reportTarget(tx, targetType, targetId);
    const moderationCase = await tx.marketplaceTrustCase.upsert({
      where: { dedupKey },
      create: { dedupKey, targetType, targetId, ...target },
      update: {},
      select: { id: true },
    });
    await tx.marketplaceReport.create({
      data: { caseId: moderationCase.id, reporterUserId, reason, explanation },
    });
    return { accepted: true };
  });
  res.status(201).json({ data: result });
}

export async function createAccountCase(req: Request, res: Response) {
  const { userId, publicReason } = req.body;
  const actorUserId = res.locals.reader.id as string;
  if (actorUserId === userId)
    throw new RequestError(
      403,
      "SELF_MODERATION_FORBIDDEN",
      "An independent administrator must open the case",
    );
  const result = await prisma.$transaction(async (tx) => {
    const owner = await tx.readerUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!owner)
      throw new RequestError(404, "USER_NOT_FOUND", "Account not found");
    const dedupKey = `USER:${userId}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${dedupKey}, 5))`;
    const item = await tx.marketplaceTrustCase.upsert({
      where: { dedupKey },
      create: {
        targetType: "USER",
        targetId: userId,
        ownerUserId: userId,
        dedupKey,
        publicReason,
      },
      update: {},
    });
    await tx.marketplaceTrustEvent.create({
      data: {
        caseId: item.id,
        actorUserId,
        action: "ACCOUNT_CASE_OPENED",
        previousState: item.state,
        resultingState: item.state,
        publicReason,
        internalNote: req.body.internalNote,
        correlationId: randomUUID(),
      },
    });
    return { id: item.id };
  });
  res.status(201).json({ data: result });
}

const publicCaseSelect = {
  id: true,
  targetType: true,
  targetId: true,
  state: true,
  severity: true,
  version: true,
  publicReason: true,
  createdAt: true,
  events: {
    select: { id: true, action: true, publicReason: true, createdAt: true },
    orderBy: [{ createdAt: "desc" as const }, { id: "asc" as const }],
    take: 100,
  },
  restrictions: { select: { decisionEventId: true, revokedAt: true } },
  appeals: {
    select: {
      id: true,
      decisionEventId: true,
      outcome: true,
      publicReason: true,
      createdAt: true,
    },
  },
} satisfies Prisma.MarketplaceTrustCaseSelect;

export async function listMarketplaceCases(req: Request, res: Response) {
  const staff = req.path.startsWith("/moderation/");
  const { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };
  const where = staff ? {} : { ownerUserId: res.locals.reader.id as string };
  const [data, total] = await Promise.all([
    prisma.marketplaceTrustCase.findMany({
      where,
      select: {
        ...publicCaseSelect,
        ...(staff
          ? {
              reports: {
                select: { reason: true, explanation: true, createdAt: true },
                take: 100,
              },
              events: {
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 100,
              },
              appeals: {
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 100,
              },
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.marketplaceTrustCase.count({ where }),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function lockCase(
  tx: Prisma.TransactionClient,
  id: string,
  expectedVersion?: number,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 6))`;
  const item = await tx.marketplaceTrustCase.findUnique({
    where: { id },
    include: {
      reports: { select: { reporterUserId: true } },
      restrictions: { where: { revokedAt: null } },
    },
  });
  if (!item) throw new RequestError(404, "CASE_NOT_FOUND", "Case not found");
  if (expectedVersion !== undefined && item.version !== expectedVersion)
    throw new RequestError(
      409,
      "CASE_VERSION_CONFLICT",
      "Reload the case before deciding it",
    );
  return item;
}

function independentStaff(
  item: { ownerUserId: string | null; reports: { reporterUserId: string }[] },
  actorUserId: string,
) {
  if (
    item.ownerUserId === actorUserId ||
    item.reports.some((report) => report.reporterUserId === actorUserId)
  )
    throw new RequestError(
      403,
      "CONFLICT_OF_INTEREST",
      "An independent moderator must decide this case",
    );
}

async function verifyReinstatement(
  tx: Prisma.TransactionClient,
  item: {
    targetType: string;
    productId: string | null;
    releaseId: string | null;
    ownerUserId: string | null;
    restrictions: { createdAt: Date }[];
  },
) {
  if (!["PRODUCT", "RELEASE", "USER"].includes(item.targetType)) return;
  const after = Math.max(
    0,
    ...item.restrictions.map((restriction) => restriction.createdAt.getTime()),
  );
  const release =
    item.targetType === "USER"
      ? null
      : item.releaseId
        ? await tx.marketplaceReleaseManifest.findUnique({
            where: { id: item.releaseId },
          })
        : (
            await tx.marketplaceProduct.findUnique({
              where: { id: item.productId! },
              select: {
                approvedSnapshot: { select: { releaseManifest: true } },
              },
            })
          )?.approvedSnapshot?.releaseManifest;
  const releases =
    item.targetType === "USER"
      ? (
          await tx.marketplaceProduct.findMany({
            where: {
              creator: { ownerUserId: item.ownerUserId },
              published: true,
            },
            select: { approvedSnapshot: { select: { releaseManifest: true } } },
          })
        ).map((product) => product.approvedSnapshot?.releaseManifest)
      : [release];
  if (
    releases.some(
      (entry) =>
        !entry?.sourceResolvedAt ||
        !entry.ownershipVerifiedAt ||
        entry.ownershipVerifiedAt.getTime() < after ||
        entry.sourceCheckStatus !== "VERIFIED" ||
        !entry.sourceCheckedAt ||
        entry.sourceCheckedAt.getTime() < after,
    )
  )
    throw new RequestError(
      409,
      "SOURCE_VERIFICATION_REQUIRED",
      "Rerun source and ownership checks after restriction before reinstatement",
    );
}

export async function decideMarketplaceCase(req: Request, res: Response) {
  const id = String(req.params.id);
  const { expectedVersion, action, severity, publicReason, internalNote } =
    req.body;
  const actorUserId = res.locals.reader.id as string;
  const result = await prisma.$transaction(
    async (tx) => {
      const item = await lockCase(tx, id, expectedVersion);
      independentStaff(item, actorUserId);
      if (
        item.targetType === "USER" &&
        !res.locals.reader.marketplaceRoles.includes("administrator")
      )
        throw new RequestError(
          403,
          "ADMINISTRATOR_REQUIRED",
          "Account restrictions require an administrator",
        );
      if (action === "DISMISS" && item.restrictions.length)
        throw new RequestError(
          409,
          "RESTRICTION_ACTIVE",
          "Lift the restriction before dismissing this case",
        );
      if (action === "LIFT") await verifyReinstatement(tx, item);
      const state =
        action === "TRIAGE"
          ? "TRIAGED"
          : action === "INVESTIGATE"
            ? "INVESTIGATING"
            : action === "DISMISS"
              ? "DISMISSED"
              : "ACTIONED";
      const event = await tx.marketplaceTrustEvent.create({
        data: {
          caseId: id,
          actorUserId,
          action,
          previousState: item.state,
          resultingState: state,
          publicReason,
          internalNote,
          correlationId: randomUUID(),
        },
      });
      if (action === "RESTRICT") {
        if (item.restrictions.length)
          throw new RequestError(
            409,
            "RESTRICTION_ACTIVE",
            "This case already has an active restriction",
          );
        await tx.marketplaceRestriction.create({
          data: {
            caseId: id,
            activeKey: `${item.targetType}:${item.targetId}`,
            decisionEventId: event.id,
          },
        });
        if (item.reviewId) await refreshRating(tx, item.reviewId);
      }
      if (action === "LIFT") {
        await tx.marketplaceRestriction.updateMany({
          where: { caseId: id, revokedAt: null },
          data: {
            activeKey: null,
            revokedAt: new Date(),
            revokedByEventId: event.id,
          },
        });
        if (item.reviewId) await refreshRating(tx, item.reviewId);
      }
      return tx.marketplaceTrustCase.update({
        where: { id },
        data: {
          state,
          severity,
          publicReason,
          version: { increment: 1 },
          ...(action === "DISMISS" ? { dedupKey: null } : {}),
        },
        select: publicCaseSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  res.json({ data: result });
}

async function refreshRating(tx: Prisma.TransactionClient, reviewId: string) {
  const review = await tx.marketplaceReview.findUniqueOrThrow({
    where: { id: reviewId },
    select: { productId: true },
  });
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${review.productId}, 2))`;
  const aggregate = await tx.marketplaceReview.aggregate({
    where: {
      productId: review.productId,
      published: true,
      trustCases: { none: activeRestrictions },
    },
    _avg: { rating: true },
    _count: true,
  });
  await tx.marketplaceProduct.update({
    where: { id: review.productId },
    data: { rating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count },
  });
}

export async function appealMarketplaceCase(req: Request, res: Response) {
  const id = String(req.params.id);
  const submittedByUserId = res.locals.reader.id as string;
  const result = await prisma.$transaction(async (tx) => {
    const item = await lockCase(tx, id);
    if (item.ownerUserId !== submittedByUserId)
      throw new RequestError(404, "CASE_NOT_FOUND", "Case not found");
    const decision = await tx.marketplaceTrustEvent.findFirst({
      where: {
        id: req.body.decisionEventId,
        caseId: id,
        action: { in: ["RESTRICT", "DISMISS", "LIFT"] },
      },
    });
    if (!decision)
      throw new RequestError(
        404,
        "DECISION_NOT_FOUND",
        "Appealable decision not found",
      );
    return tx.marketplaceAppeal.create({
      data: { caseId: id, submittedByUserId, ...req.body },
      select: { id: true, outcome: true },
    });
  });
  res.status(201).json({ data: result });
}

export async function decideMarketplaceAppeal(req: Request, res: Response) {
  const id = String(req.params.id);
  const actorUserId = res.locals.reader.id as string;
  const { expectedVersion, outcome, publicReason, internalNote } = req.body;
  const result = await prisma.$transaction(async (tx) => {
    const appeal = await tx.marketplaceAppeal.findUnique({ where: { id } });
    if (!appeal)
      throw new RequestError(404, "APPEAL_NOT_FOUND", "Appeal not found");
    const item = await lockCase(tx, appeal.caseId, expectedVersion);
    independentStaff(item, actorUserId);
    const original = await tx.marketplaceTrustEvent.findUniqueOrThrow({
      where: { id: appeal.decisionEventId },
    });
    if (
      item.targetType === "USER" &&
      !res.locals.reader.marketplaceRoles.includes("administrator")
    )
      throw new RequestError(
        403,
        "ADMINISTRATOR_REQUIRED",
        "Account appeals require an administrator",
      );
    if (
      original.actorUserId === actorUserId &&
      (!res.locals.reader.marketplaceRoles.includes("administrator") ||
        !internalNote?.trim())
    )
      throw new RequestError(
        403,
        "INDEPENDENT_REVIEW_REQUIRED",
        "Use another moderator, or record an administrator exception rationale",
      );
    if (appeal.outcome !== "PENDING")
      throw new RequestError(
        409,
        "APPEAL_ALREADY_DECIDED",
        "Appeal was already decided",
      );
    if (outcome === "REVERSED") await verifyReinstatement(tx, item);
    const event = await tx.marketplaceTrustEvent.create({
      data: {
        caseId: item.id,
        actorUserId,
        action: `APPEAL_${outcome}`,
        previousState: item.state,
        resultingState: "ACTIONED",
        publicReason,
        internalNote,
        correlationId: randomUUID(),
      },
    });
    if (outcome === "REVERSED") {
      await tx.marketplaceRestriction.updateMany({
        where: {
          caseId: item.id,
          decisionEventId: original.id,
          revokedAt: null,
        },
        data: {
          activeKey: null,
          revokedAt: new Date(),
          revokedByEventId: event.id,
        },
      });
      if (item.reviewId) await refreshRating(tx, item.reviewId);
    }
    await tx.marketplaceTrustCase.update({
      where: { id: item.id },
      data: { state: "ACTIONED", publicReason, version: { increment: 1 } },
    });
    return tx.marketplaceAppeal.update({
      where: { id },
      data: {
        outcome,
        publicReason,
        decidedByUserId: actorUserId,
        decidedAt: new Date(),
      },
      select: { id: true, outcome: true, publicReason: true },
    });
  });
  res.json({ data: result });
}
