import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const NOTIFICATION_LIMIT = 12;

/** Client-facing keys stay lowercase so the UI owns presentation. */
const typeKeys = {
  LISTING_APPROVED: "approved",
  LISTING_CHANGES_REQUESTED: "changes_requested",
  LISTING_REJECTED: "rejected",
} as const;

/**
 * The creator's own decision feed. Only a staff decision creates a row; the
 * public reason is copied at decision time and the internal note is never read
 * here. `unread` counts every unread row, not just the page returned.
 */
export async function listMarketplaceNotifications(_req: Request, res: Response) {
  const userId = String(res.locals.reader.id);
  const [rows, unread] = await prisma.$transaction([
    prisma.marketplaceNotification.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: NOTIFICATION_LIMIT,
      select: {
        id: true,
        type: true,
        publicReason: true,
        readAt: true,
        createdAt: true,
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.marketplaceNotification.count({ where: { userId, readAt: null } }),
  ]);

  res.json({
    data: {
      unread,
      notifications: rows.map((row) => ({
        id: row.id,
        type: typeKeys[row.type],
        productName: row.product.name,
        productSlug: row.product.slug,
        publicReason: row.publicReason,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
    },
  });
}

/** Marks every unread row, or only the ids supplied. Always owner-scoped. */
export async function markMarketplaceNotificationsRead(req: Request, res: Response) {
  const userId = String(res.locals.reader.id);
  const ids = req.body.ids as string[] | undefined;
  const result = await prisma.marketplaceNotification.updateMany({
    where: { userId, readAt: null, ...(ids === undefined ? {} : { id: { in: ids } }) },
    data: { readAt: new Date() },
  });
  const unread = await prisma.marketplaceNotification.count({ where: { userId, readAt: null } });
  res.json({ data: { updated: result.count, unread } });
}
