import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { MarketplaceRequestError as RequestError } from "../lib/marketplaceRequestError.js";
import { refreshProductRating } from "../lib/marketplaceRatings.js";
import { activeRestrictions, publicProductWhere } from "../lib/marketplaceVisibility.js";

const day = 24 * 60 * 60 * 1000;

function reviewDigest(body: string) {
  return createHash("sha256").update(body.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

function reviewData(review: { id: string; rating: number; body: string; status: string; version: number; updatedAt: Date }) {
  return { id: review.id, rating: review.rating, body: review.body, status: review.status, version: review.version, updatedAt: review.updatedAt };
}

export async function getMyMarketplaceReview(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({
    where: { ...publicProductWhere, slug: String(req.params.slug) },
    select: { id: true, creator: { select: { ownerUserId: true } } },
  });
  if (!product) throw new RequestError(404, "LISTING_NOT_FOUND", "Listing not found");
  const userId = res.locals.reader.id as string;
  const [order, review] = await Promise.all([
    prisma.marketplaceOrder.findUnique({ where: { userId_productId: { userId, productId: product.id } }, select: { status: true } }),
    prisma.marketplaceReview.findUnique({ where: { userId_productId: { userId, productId: product.id } } }),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({ data: {
    eligible: res.locals.reader.emailVerified && order?.status === "completed" && product.creator.ownerUserId !== userId,
    reason: !res.locals.reader.emailVerified ? "EMAIL_VERIFICATION_REQUIRED" : product.creator.ownerUserId === userId ? "CREATOR_CONFLICT" : order?.status !== "completed" ? "ACQUISITION_REQUIRED" : null,
    review: review ? reviewData(review) : null,
  } });
}

export async function saveMyMarketplaceReview(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const { rating, body, expectedVersion } = req.body as { rating: number; body: string; expectedVersion?: number };
  const digest = reviewDigest(body);
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.marketplaceProduct.findFirst({
      where: { ...publicProductWhere, slug: String(req.params.slug) },
      select: { id: true, creator: { select: { ownerUserId: true } } },
    });
    if (!product) throw new RequestError(404, "LISTING_NOT_FOUND", "Listing not found");
    if (product.creator.ownerUserId === userId)
      throw new RequestError(403, "CREATOR_CONFLICT", "Creators cannot review their own listings");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${product.id}:${userId}`}, 7))`;
    const [order, user, existing, duplicate] = await Promise.all([
      tx.marketplaceOrder.findUnique({ where: { userId_productId: { userId, productId: product.id } }, select: { status: true, createdAt: true } }),
      tx.readerUser.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
      tx.marketplaceReview.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
        include: { trustCases: { where: activeRestrictions, select: { id: true } } },
      }),
      tx.marketplaceReview.findFirst({
        where: { bodyHash: digest, userId: { not: userId }, status: { in: ["PUBLISHED", "HELD"] }, createdAt: { gte: new Date(now.getTime() - 30 * day) } },
        select: { id: true },
      }),
    ]);
    if (order?.status !== "completed")
      throw new RequestError(403, "ACQUISITION_REQUIRED", "Acquire this listing before reviewing it");
    if (existing?.trustCases.length)
      throw new RequestError(409, "REVIEW_RESTRICTED", "Appeal the active review decision before editing");
    if (existing && expectedVersion !== existing.version)
      throw new RequestError(409, "REVIEW_VERSION_CONFLICT", "Reload your review before editing it");
    if (!existing && expectedVersion !== undefined)
      throw new RequestError(409, "REVIEW_VERSION_CONFLICT", "Reload the review form before submitting");
    if (existing?.status !== "WITHDRAWN" && existing?.body === body && existing.rating === rating)
      return { review: reviewData(existing), created: false };
    const edits = existing ? await tx.marketplaceReviewAudit.count({
      where: { reviewId: existing.id, action: "EDIT", createdAt: { gte: new Date(now.getTime() - day) } },
    }) : 0;
    // ponytail: exact-copy and age holds are bounded signals; add scored detection only if abuse data warrants it.
    const status = duplicate || now.getTime() - user.createdAt.getTime() < 7 * day
      || now.getTime() - order.createdAt.getTime() < day || edits >= 3
      ? "HELD" : "PUBLISHED";
    const review = existing
      ? await tx.marketplaceReview.update({
          where: { id: existing.id },
          data: { rating, body, bodyHash: digest, status, version: { increment: 1 } },
        })
      : await tx.marketplaceReview.create({
          data: { productId: product.id, userId, author: `TermSpace member ${userId.slice(-6)}`, rating, body, bodyHash: digest, status },
        });
    await tx.marketplaceReviewAudit.create({
      data: { reviewId: review.id, actorUserId: userId, action: existing ? existing.status === "WITHDRAWN" ? "RESUBMIT" : "EDIT" : "CREATE", snapshot: { rating, body, status } },
    });
    await refreshProductRating(tx, product.id);
    return { review: reviewData(review), created: !existing };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  res.status(result.created ? 201 : 200).json({ data: result.review });
}

export async function withdrawMyMarketplaceReview(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  await prisma.$transaction(async (tx) => {
    const product = await tx.marketplaceProduct.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
    if (!product) return;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${product.id}:${userId}`}, 7))`;
    const review = await tx.marketplaceReview.findUnique({
      where: { userId_productId: { userId, productId: product.id } }, select: { id: true, productId: true, rating: true, body: true, status: true },
    });
    if (!review || review.status === "WITHDRAWN") return;
    await tx.marketplaceReview.update({ where: { id: review.id }, data: { status: "WITHDRAWN", version: { increment: 1 } } });
    await tx.marketplaceReviewAudit.create({ data: { reviewId: review.id, actorUserId: userId, action: "WITHDRAW", snapshot: { rating: review.rating, body: review.body, status: "WITHDRAWN" } } });
    await refreshProductRating(tx, review.productId);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  res.status(204).send();
}

export async function listCreatorMarketplaceReviews(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const where = { status: "PUBLISHED" as const, trustCases: { none: activeRestrictions }, product: { creator: { ownerUserId: res.locals.reader.id as string } } };
  const [reviews, total] = await Promise.all([
    prisma.marketplaceReview.findMany({ where, select: {
      id: true, author: true, rating: true, body: true, createdAt: true, product: { select: { name: true, slug: true } },
      response: { select: { id: true, body: true, status: true, trustCases: { where: activeRestrictions, select: { id: true } } } },
    }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceReview.count({ where }),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({ data: reviews.map(({ response, ...review }) => ({ ...review, response: response?.status === "PUBLISHED" && !response.trustCases.length ? { id: response.id, body: response.body } : null })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function saveCreatorReviewResponse(req: Request, res: Response) {
  const actorUserId = res.locals.reader.id as string;
  const body = req.body.body as string;
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.marketplaceReview.findFirst({
      where: { id: String(req.params.id), status: "PUBLISHED", trustCases: { none: activeRestrictions }, product: { creator: { ownerUserId: actorUserId } } },
      select: { id: true, response: { include: { trustCases: { where: activeRestrictions, select: { id: true } } } } },
    });
    if (!review) throw new RequestError(404, "REVIEW_NOT_FOUND", "Review not found");
    if (review.response?.trustCases.length) throw new RequestError(409, "RESPONSE_RESTRICTED", "Appeal the active response decision before editing");
    const response = await tx.marketplaceReviewResponse.upsert({
      where: { reviewId: review.id },
      create: { reviewId: review.id, creatorUserId: actorUserId, body, status: "PUBLISHED" },
      update: { creatorUserId: actorUserId, body, status: "PUBLISHED", version: { increment: 1 } },
    });
    await tx.marketplaceReviewAudit.create({ data: { reviewId: review.id, actorUserId, action: "CREATOR_RESPONSE", snapshot: { responseId: response.id, body, status: response.status } } });
    return { id: response.id, body: response.body };
  });
  res.json({ data: result });
}

export async function withdrawCreatorReviewResponse(req: Request, res: Response) {
  const actorUserId = res.locals.reader.id as string;
  await prisma.$transaction(async (tx) => {
    const response = await tx.marketplaceReviewResponse.findFirst({
      where: { reviewId: String(req.params.id), review: { product: { creator: { ownerUserId: actorUserId } } } },
      select: { id: true, reviewId: true, body: true, status: true },
    });
    if (!response || response.status === "WITHDRAWN") return;
    await tx.marketplaceReviewResponse.update({ where: { id: response.id }, data: { status: "WITHDRAWN", version: { increment: 1 } } });
    await tx.marketplaceReviewAudit.create({ data: { reviewId: response.reviewId, actorUserId, action: "WITHDRAW_RESPONSE", snapshot: { responseId: response.id, body: response.body, status: "WITHDRAWN" } } });
  });
  res.status(204).send();
}

export async function listHeldMarketplaceReviews(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const where = { status: "HELD" as const, trustCases: { none: activeRestrictions } };
  const [reviews, total] = await Promise.all([
    prisma.marketplaceReview.findMany({ where, select: { id: true, author: true, rating: true, body: true, version: true, createdAt: true, product: { select: { name: true, slug: true } } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceReview.count({ where }),
  ]);
  res.set("Cache-Control", "private, no-store");
  res.json({ data: reviews, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function moderateMarketplaceReview(req: Request, res: Response) {
  const actorUserId = res.locals.reader.id as string;
  const { action, expectedVersion, publicReason, internalNote } = req.body as { action: "APPROVE" | "HOLD" | "REMOVE"; expectedVersion: number; publicReason: string; internalNote?: string };
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.marketplaceReview.findUnique({
      where: { id: String(req.params.id) },
      include: { product: { select: { id: true, creator: { select: { ownerUserId: true } } } }, trustCases: { where: activeRestrictions, select: { id: true } } },
    });
    if (!review) throw new RequestError(404, "REVIEW_NOT_FOUND", "Review not found");
    if (review.userId === actorUserId || review.product.creator.ownerUserId === actorUserId)
      throw new RequestError(403, "SELF_MODERATION_FORBIDDEN", "An independent moderator must decide this review");
    if (review.version !== expectedVersion) throw new RequestError(409, "REVIEW_VERSION_CONFLICT", "Reload the review before deciding it");
    if (review.status === "WITHDRAWN") throw new RequestError(409, "REVIEW_WITHDRAWN", "Withdrawn reviews cannot be moderated");
    if (review.trustCases.length) throw new RequestError(409, "REVIEW_RESTRICTED", "Use the active case to decide this review");
    let status = review.status;
    if (action === "APPROVE") {
      if (review.status !== "HELD") throw new RequestError(409, "REVIEW_NOT_HELD", "Only held reviews need approval");
      status = "PUBLISHED";
      await tx.marketplaceReview.update({ where: { id: review.id }, data: { status, version: { increment: 1 } } });
    } else {
      const dedupKey = `REVIEW:${review.id}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${dedupKey}, 5))`;
      const moderationCase = await tx.marketplaceTrustCase.upsert({
        where: { dedupKey },
        create: { dedupKey, targetType: "REVIEW", targetId: review.id, reviewId: review.id, ownerUserId: review.userId, publicReason },
        update: {},
        include: { reports: { where: { reporterUserId: actorUserId }, select: { id: true } } },
      });
      if (moderationCase.reports.length) throw new RequestError(403, "CONFLICT_OF_INTEREST", "A reporter cannot decide this review");
      const event = await tx.marketplaceTrustEvent.create({ data: {
        caseId: moderationCase.id, actorUserId, action: "RESTRICT", previousState: moderationCase.state, resultingState: "ACTIONED",
        publicReason, internalNote, correlationId: randomUUID(),
      } });
      await tx.marketplaceRestriction.create({ data: { caseId: moderationCase.id, activeKey: dedupKey, decisionEventId: event.id } });
      await tx.marketplaceTrustCase.update({ where: { id: moderationCase.id }, data: { state: "ACTIONED", publicReason, version: { increment: 1 } } });
    }
    await tx.marketplaceReviewAudit.create({ data: { reviewId: review.id, actorUserId, action: `MODERATE_${action}`, snapshot: { rating: review.rating, body: review.body, status, publicReason } } });
    await refreshProductRating(tx, review.productId);
    return { id: review.id, status, version: review.version + (action === "APPROVE" ? 1 : 0) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ data: result });
}
