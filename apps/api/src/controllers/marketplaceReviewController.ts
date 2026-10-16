import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

class ReviewError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

function sendReviewError(res: Response, error: unknown): boolean {
  if (!(error instanceof ReviewError)) return false;
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
  return true;
}

/** What the reviewer sees of their own review, including a moderator's decision. */
function serializeOwnReview(review: {
  id: string; author: string; rating: number; body: string; createdAt: Date; updatedAt: Date;
  hiddenAt: Date | null; hiddenReason: string | null;
}) {
  return {
    id: review.id,
    author: review.author,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    hidden: review.hiddenAt ? { at: review.hiddenAt, reason: review.hiddenReason } : null,
  };
}

/**
 * `rating` and `reviewCount` on the listing are derived here, in the same
 * transaction as the change, and never read from a request. Callers hold the
 * per-listing advisory lock so two writers cannot interleave.
 */
async function recomputeRating(tx: Prisma.TransactionClient, productId: string) {
  const { _avg, _count } = await tx.marketplaceReview.aggregate({
    where: { productId, published: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.marketplaceProduct.update({
    where: { id: productId },
    data: { rating: _avg.rating === null ? 0 : Math.round(_avg.rating * 10) / 10, reviewCount: _count._all },
  });
}

const lockProductReviews = (tx: Prisma.TransactionClient, productId: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 7))`;

/** The reader's own review of a listing, and whether they may write one. */
export async function getMyReview(req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store");
  const userId = res.locals.reader.id as string;
  const product = await prisma.marketplaceProduct.findFirst({
    where: { slug: String(req.params.slug), published: true },
    select: { id: true, creator: { select: { ownerUserId: true } } },
  });
  if (!product) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Product not found" } }); return; }
  const [order, review] = await Promise.all([
    prisma.marketplaceOrder.findFirst({ where: { userId, productId: product.id, status: "completed" }, select: { id: true } }),
    prisma.marketplaceReview.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
      select: { id: true, author: true, rating: true, body: true, createdAt: true, updatedAt: true, hiddenAt: true, hiddenReason: true },
    }),
  ]);
  const eligibility = product.creator.ownerUserId === userId ? "own_listing" : order ? "eligible" : "not_acquired";
  res.json({ data: { eligibility, review: review ? serializeOwnReview(review) : null } });
}

/** Create or replace the reader's review. Only someone with the item in their library may review it. */
export async function saveReview(req: Request, res: Response) {
  if (!res.locals.reader.emailVerified) {
    res.status(403).json({ error: { code: "EMAIL_VERIFICATION_REQUIRED", message: "Verify your email before writing a review" } });
    return;
  }
  const userId = res.locals.reader.id as string;
  const { rating, body, displayName } = req.body as { rating: number; body: string; displayName: string };
  try {
    const saved = await prisma.$transaction(async (tx) => {
      const product = await tx.marketplaceProduct.findFirst({
        where: { slug: String(req.params.slug), published: true },
        select: { id: true, creator: { select: { ownerUserId: true } } },
      });
      if (!product) throw new ReviewError(404, "NOT_FOUND", "Product not found");
      await lockProductReviews(tx, product.id);
      if (product.creator.ownerUserId === userId) throw new ReviewError(403, "OWN_LISTING", "You cannot review your own listing");
      const order = await tx.marketplaceOrder.findFirst({ where: { userId, productId: product.id, status: "completed" }, select: { id: true } });
      if (!order) throw new ReviewError(403, "ACQUISITION_REQUIRED", "Add this resource to your library before reviewing it");
      const existing = await tx.marketplaceReview.findUnique({ where: { userId_productId: { userId, productId: product.id } }, select: { id: true, hiddenAt: true } });
      if (existing?.hiddenAt) throw new ReviewError(409, "REVIEW_HIDDEN", "A moderator hid this review, so it can no longer be edited");
      const select = { id: true, author: true, rating: true, body: true, createdAt: true, updatedAt: true, hiddenAt: true, hiddenReason: true } as const;
      const data = { author: displayName, rating, body, verifiedPurchase: true, published: true };
      const review = existing
        ? await tx.marketplaceReview.update({ where: { id: existing.id }, data, select })
        : await tx.marketplaceReview.create({ data: { ...data, productId: product.id, userId }, select });
      await recomputeRating(tx, product.id);
      return { review, created: !existing };
    });
    res.status(saved.created ? 201 : 200).json({ data: serializeOwnReview(saved.review) });
  } catch (error) {
    if (sendReviewError(res, error)) return;
    throw error;
  }
}

export async function deleteReview(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.marketplaceProduct.findFirst({ where: { slug: String(req.params.slug), published: true }, select: { id: true } });
      if (!product) throw new ReviewError(404, "NOT_FOUND", "Product not found");
      await lockProductReviews(tx, product.id);
      const review = await tx.marketplaceReview.findUnique({ where: { userId_productId: { userId, productId: product.id } }, select: { id: true, hiddenAt: true } });
      if (!review) throw new ReviewError(404, "NOT_FOUND", "You have not reviewed this listing");
      // Deleting would erase a moderator's decision and let the reader post again.
      if (review.hiddenAt) throw new ReviewError(409, "REVIEW_HIDDEN", "A moderator hid this review, so it can no longer be deleted");
      await tx.marketplaceReview.delete({ where: { id: review.id } });
      await recomputeRating(tx, product.id);
    });
    res.status(204).send();
  } catch (error) {
    if (sendReviewError(res, error)) return;
    throw error;
  }
}

/** Every review of a listing, hidden ones included, for the moderator who is reviewing it. */
export async function listProductReviewsForModeration(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, creator: { select: { ownerUserId: true } } },
  });
  if (!product) { res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Marketplace listing not found" } }); return; }
  if (product.creator.ownerUserId === res.locals.reader.id) {
    res.status(403).json({ error: { code: "SELF_MODERATION_FORBIDDEN", message: "Staff cannot moderate a listing they own" } });
    return;
  }
  const reviews = await prisma.marketplaceReview.findMany({
    where: { productId: product.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    select: { id: true, author: true, rating: true, body: true, createdAt: true, updatedAt: true, hiddenAt: true, hiddenReason: true },
  });
  res.json({ data: reviews.map((review) => ({
    id: review.id, author: review.author, rating: review.rating, body: review.body,
    createdAt: review.createdAt, updatedAt: review.updatedAt,
    hidden: review.hiddenAt ? { at: review.hiddenAt, reason: review.hiddenReason } : null,
  })) });
}

export async function setReviewVisibility(req: Request, res: Response) {
  const actorId = res.locals.reader.id as string;
  const { action, reason } = req.body as { action: "hide" | "restore"; reason?: string };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const found = await tx.marketplaceReview.findUnique({
        where: { id: String(req.params.id) },
        select: { id: true, productId: true, product: { select: { creator: { select: { ownerUserId: true } } } } },
      });
      if (!found) throw new ReviewError(404, "NOT_FOUND", "Review not found");
      if (found.product.creator.ownerUserId === actorId) throw new ReviewError(403, "SELF_MODERATION_FORBIDDEN", "Staff cannot moderate a listing they own");
      await lockProductReviews(tx, found.productId);
      const review = await tx.marketplaceReview.update({
        where: { id: found.id },
        data: action === "hide"
          ? { published: false, hiddenAt: new Date(), hiddenReason: reason, hiddenById: actorId }
          : { published: true, hiddenAt: null, hiddenReason: null, hiddenById: null },
        select: { id: true, hiddenAt: true, hiddenReason: true },
      });
      await recomputeRating(tx, found.productId);
      return review;
    });
    res.json({ data: { id: result.id, hidden: result.hiddenAt ? { at: result.hiddenAt, reason: result.hiddenReason } : null } });
  } catch (error) {
    if (sendReviewError(res, error)) return;
    throw error;
  }
}
