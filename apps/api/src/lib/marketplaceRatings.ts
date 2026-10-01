import type { Prisma } from "@prisma/client";
import { activeRestrictions } from "./marketplaceVisibility.js";

export async function refreshProductRating(tx: Prisma.TransactionClient, productId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 2))`;
  const aggregate = await tx.marketplaceReview.aggregate({
    where: {
      productId,
      status: "PUBLISHED",
      trustCases: { none: activeRestrictions },
    },
    _avg: { rating: true },
    _count: true,
  });
  await tx.marketplaceProduct.update({
    where: { id: productId },
    data: { rating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count },
  });
  const day = new Date(new Date().toISOString().slice(0, 10));
  await tx.marketplaceDailyMetric.upsert({
    where: { productId_day: { productId, day } },
    create: { productId, day, ratingSnapshot: aggregate._avg.rating ?? 0, reviewCountSnapshot: aggregate._count },
    update: { ratingSnapshot: aggregate._avg.rating ?? 0, reviewCountSnapshot: aggregate._count },
  });
}
