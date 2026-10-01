import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { publicProductWhere } from "../lib/marketplaceVisibility.js";
import { MarketplaceRequestError } from "../lib/marketplaceRequestError.js";

const today = () => new Date(new Date().toISOString().slice(0, 10));

export async function recordMarketplaceView(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({ where: { ...publicProductWhere, slug: String(req.params.slug) }, select: { id: true } });
  if (!product) throw new MarketplaceRequestError(404, "LISTING_NOT_FOUND", "Listing not found");
  const day = today();
  // ponytail: browser-side once-per-day deduplication is approximate; add audited event sampling if decisions demand exact unique views.
  await prisma.marketplaceDailyMetric.upsert({
    where: { productId_day: { productId: product.id, day } },
    create: { productId: product.id, day, views: 1 },
    update: { views: { increment: 1 } },
  });
  res.status(204).send();
}

export async function recordMarketplaceInstallationView(productId: string) {
  const day = today();
  await prisma.marketplaceDailyMetric.upsert({
    where: { productId_day: { productId, day } },
    create: { productId, day, installationViews: 1 },
    update: { installationViews: { increment: 1 } },
  });
}

export async function getCreatorAnalytics(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const where = { creator: { ownerUserId: res.locals.reader.id as string } };
  const [products, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({ where, select: { id: true, slug: true, name: true, rating: true, reviewCount: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceProduct.count({ where }),
  ]);
  const ids = products.map((product) => product.id);
  const since = today(); since.setUTCDate(since.getUTCDate() - 29);
  const [metrics, orders, recentOrders, releases] = ids.length ? await Promise.all([
    prisma.marketplaceDailyMetric.findMany({ where: { productId: { in: ids }, day: { gte: since } }, orderBy: { day: "asc" } }),
    prisma.marketplaceOrder.groupBy({ by: ["productId", "releaseManifestId"], where: { productId: { in: ids }, status: "completed" }, _count: true }),
    prisma.marketplaceOrder.groupBy({ by: ["productId"], where: { productId: { in: ids }, status: "completed", createdAt: { gte: since } }, _count: true }),
    prisma.marketplaceReleaseManifest.findMany({ where: { productVersion: { productId: { in: ids } }, publishedAt: { not: null } }, select: { id: true, productVersion: { select: { productId: true, version: true } } } }),
  ]) : [[], [], [], []];
  const releaseNames = new Map(releases.map((release) => [release.id, release.productVersion.version]));
  res.set("Cache-Control", "private, no-store");
  res.json({ data: products.map((product) => {
    const daily = metrics.filter((metric) => metric.productId === product.id).map((metric) => ({ day: metric.day, views: metric.views, installationViews: metric.installationViews, rating: metric.ratingSnapshot === null ? null : Number(metric.ratingSnapshot), reviewCount: metric.reviewCountSnapshot }));
    const acquisitions = orders.filter((order) => order.productId === product.id).reduce((sum, order) => sum + order._count, 0);
    const recentAcquisitions = recentOrders.find((order) => order.productId === product.id)?._count ?? 0;
    const views = daily.reduce((sum, metric) => sum + metric.views, 0);
    const installationViews = daily.reduce((sum, metric) => sum + metric.installationViews, 0);
    return { id: product.id, slug: product.slug, name: product.name, rating: Number(product.rating), reviewCount: product.reviewCount,
      views, installationViews, acquisitions, recentAcquisitions, acquisitionConversionPercent: views ? Math.round(recentAcquisitions / views * 1000) / 10 : null,
      installationConversionPercent: recentAcquisitions ? Math.round(installationViews / recentAcquisitions * 1000) / 10 : null,
      daily, versions: orders.filter((order) => order.productId === product.id && order.releaseManifestId).map((order) => ({ version: releaseNames.get(order.releaseManifestId!) ?? "legacy", acquisitions: order._count })),
    };
  }), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
