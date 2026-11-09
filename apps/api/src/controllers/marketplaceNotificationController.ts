import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { visibleSupportNotifications } from "../lib/supportNotifications.js";

const NOTIFICATION_LIMIT = 12;

/** Client-facing keys stay lowercase so the UI owns presentation. */
const typeKeys = {
  LISTING_APPROVED: "approved",
  LISTING_CHANGES_REQUESTED: "changes_requested",
  LISTING_REJECTED: "rejected",
} as const;

const supportTypeKeys = {
  TICKET_CREATED: "support_created", MEMBER_REPLIED: "support_message",
  STAFF_REPLIED: "support_reply", RESOLVED: "support_resolved",
} as const;

/**
 * Private decisions and support events, newest first. Support previews contain
 * only an event type and ticket reference; no subject, message or screenshot.
 */
export async function listMarketplaceNotifications(_req: Request, res: Response) {
  const userId = String(res.locals.reader.id);
  res.set("Cache-Control", "private, no-store");
  const supportWhere = visibleSupportNotifications(res.locals.reader);
  const [rows, unread, supportRows, supportUnread] = await prisma.$transaction([
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
    prisma.supportNotification.findMany({
      where: supportWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: NOTIFICATION_LIMIT,
      select: { id: true, type: true, ticketId: true, ticket: { select: { ownerId: true } }, readAt: true, createdAt: true },
    }),
    prisma.supportNotification.count({ where: { ...supportWhere, readAt: null } }),
  ]);

  const notifications = [
    ...rows.map(row => ({
      id: row.id, type: typeKeys[row.type], productName: row.product.name, productSlug: row.product.slug,
      publicReason: row.publicReason, readAt: row.readAt, createdAt: row.createdAt,
    })),
    ...supportRows.map(row => ({
      id: row.id, type: supportTypeKeys[row.type], ticketId: row.ticketId,
      staff: row.ticket.ownerId !== userId, readAt: row.readAt, createdAt: row.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0, NOTIFICATION_LIMIT);
  res.json({ data: { unread: unread + supportUnread, notifications } });
}

/** Marks every unread row, or only the ids supplied. Always owner-scoped. */
export async function markMarketplaceNotificationsRead(req: Request, res: Response) {
  const userId = String(res.locals.reader.id);
  const ids = req.body.ids as string[] | undefined;
  res.set("Cache-Control", "private, no-store");
  const supportWhere = visibleSupportNotifications(res.locals.reader);
  const selection = { readAt: null, ...(ids === undefined ? {} : { id: { in: ids } }) };
  const data = { readAt: new Date() };
  const [moderation, support] = await prisma.$transaction([
    prisma.marketplaceNotification.updateMany({ where: { userId, ...selection }, data }),
    prisma.supportNotification.updateMany({ where: { ...supportWhere, ...selection }, data }),
  ]);
  const [unread, supportUnread] = await prisma.$transaction([
    prisma.marketplaceNotification.count({ where: { userId, readAt: null } }),
    prisma.supportNotification.count({ where: { ...supportWhere, readAt: null } }),
  ]);
  res.json({ data: { updated: moderation.count + support.count, unread: unread + supportUnread } });
}
