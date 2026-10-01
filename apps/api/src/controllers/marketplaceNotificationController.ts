import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

type Notice = { id: string; kind: string; product: { slug: string; name: string }; text: string; createdAt: Date };
const decisionActions = ["CHANGES_REQUESTED", "APPROVED", "REJECTED", "SUSPENDED", "REINSTATED", "ARCHIVED", "PUBLISHED"] as const;

function send(res: Response, notices: Notice[], readAt: Date | null) {
  res.set("Cache-Control", "private, no-store");
  res.json({ data: notices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50).map((notice) => ({ ...notice, read: Boolean(readAt && notice.createdAt <= readAt) })) });
}

export async function listMemberNotifications(_req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const [reader, orders, favorites] = await Promise.all([
    prisma.readerUser.findUniqueOrThrow({ where: { id: userId }, select: { memberNotificationsReadAt: true } }),
    prisma.marketplaceOrder.findMany({ where: { userId, status: "completed" }, select: { productId: true, createdAt: true } }),
    prisma.marketplaceFavorite.findMany({ where: { userId }, select: { productId: true, createdAt: true } }),
  ]);
  const watching = new Map<string, Date>();
  for (const item of [...orders, ...favorites]) {
    const previous = watching.get(item.productId);
    if (!previous || item.createdAt < previous) watching.set(item.productId, item.createdAt);
  }
  const events = watching.size ? await prisma.marketplaceListingLifecycleEvent.findMany({
    where: { productId: { in: [...watching.keys()] }, action: { in: [...decisionActions] } },
    select: { id: true, action: true, publicReason: true, createdAt: true, productId: true, product: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" }, take: 200,
  }) : [];
  send(res, events.filter((event) => event.createdAt > watching.get(event.productId)!).map((event) => ({ id: event.id, kind: "LISTING_UPDATE", product: event.product, text: event.publicReason || event.action.replaceAll("_", " ").toLowerCase(), createdAt: event.createdAt })), reader.memberNotificationsReadAt);
}

export async function markMemberNotificationsRead(_req: Request, res: Response) {
  await prisma.readerUser.update({ where: { id: res.locals.reader.id as string }, data: { memberNotificationsReadAt: new Date() } });
  res.status(204).send();
}

export async function listCreatorNotifications(_req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const ownerWhere = { creator: { ownerUserId: userId } } as const;
  const [reader, decisions, reviews, cases, failures] = await Promise.all([
    prisma.readerUser.findUniqueOrThrow({ where: { id: userId }, select: { creatorNotificationsReadAt: true } }),
    prisma.marketplaceListingLifecycleEvent.findMany({ where: { product: ownerWhere, action: { in: [...decisionActions] }, actorUserId: { not: userId } }, select: { id: true, action: true, publicReason: true, createdAt: true, product: { select: { slug: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.marketplaceReview.findMany({ where: { product: ownerWhere, status: "PUBLISHED" }, select: { id: true, rating: true, updatedAt: true, product: { select: { slug: true, name: true } } }, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.marketplaceReport.findMany({ where: { case: { OR: [
      { product: ownerWhere }, { release: { productVersion: { product: ownerWhere } } },
      { review: { product: ownerWhere } }, { response: { review: { product: ownerWhere } } },
      { placement: { product: ownerWhere } },
    ] } }, select: { id: true, createdAt: true, case: { select: { targetType: true, product: { select: { slug: true, name: true } }, release: { select: { productVersion: { select: { product: { select: { slug: true, name: true } } } } } }, review: { select: { product: { select: { slug: true, name: true } } } }, response: { select: { review: { select: { product: { select: { slug: true, name: true } } } } } }, placement: { select: { product: { select: { slug: true, name: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.marketplaceSourceCheck.findMany({ where: { outcome: { not: "VERIFIED" }, releaseManifest: { productVersion: { product: ownerWhere } } }, select: { id: true, errorCode: true, createdAt: true, releaseManifest: { select: { productVersion: { select: { product: { select: { slug: true, name: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const notices: Notice[] = [
    ...decisions.map((event) => ({ id: event.id, kind: "DECISION", product: event.product, text: event.publicReason || event.action.replaceAll("_", " ").toLowerCase(), createdAt: event.createdAt })),
    ...reviews.map((review) => ({ id: review.id, kind: "REVIEW", product: review.product, text: `${review.rating}/5 review published or updated`, createdAt: review.updatedAt })),
    ...cases.flatMap((report) => {
      const item = report.case;
      const product = item.product ?? item.release?.productVersion.product ?? item.review?.product ?? item.response?.review.product ?? item.placement?.product;
      return product ? [{ id: report.id, kind: "REPORT", product, text: `${item.targetType.toLowerCase()} report opened`, createdAt: report.createdAt }] : [];
    }),
    ...failures.map((check) => ({ id: check.id, kind: "HEALTH", product: check.releaseManifest.productVersion.product, text: check.errorCode || "Source verification failed", createdAt: check.createdAt })),
  ];
  send(res, notices, reader.creatorNotificationsReadAt);
}

export async function markCreatorNotificationsRead(_req: Request, res: Response) {
  await prisma.readerUser.update({ where: { id: res.locals.reader.id as string }, data: { creatorNotificationsReadAt: new Date() } });
  res.status(204).send();
}
