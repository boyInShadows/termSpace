import type { Prisma, SupportStatus } from "@prisma/client";
import type { RequestHandler } from "express";
import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { lockSupportAccounts, SupportError } from "../lib/supportAccess.js";
import type { supportListSchema, supportMessagesSchema } from "../validation/schemas.js";

const pageSize = 20;
const ownerSelect = { marketplaceCreator: { select: { name: true } } } as const;
const ticketSelect = {
  id: true, subject: true, category: true, status: true, version: true,
  createdAt: true, updatedAt: true, ownerId: true, owner: { select: ownerSelect },
} as const;
type Ticket = Prisma.SupportTicketGetPayload<{ select: typeof ticketSelect }>;

function ticketData(ticket: Ticket, readerId: string) {
  const { owner, ownerId, ...data } = ticket;
  return { ...data, isOwner: ownerId === readerId, requester: owner.marketplaceCreator?.name || "Member" };
}

function scope(readerId: string, inbox: boolean): Prisma.SupportTicketWhereInput {
  return { ...(inbox ? {} : { ownerId: readerId }), owner: { deletedAt: null } };
}

const missing = () => new SupportError(404, "SUPPORT_NOT_FOUND", "Ticket not found.");
const conflict = () => new SupportError(409, "SUPPORT_CONFLICT", "This conversation changed. Review the latest messages, then try again. Your draft has not been sent.");

export const createSupportTicket: RequestHandler = async (req, res) => {
  const ownerId = res.locals.reader.id as string;
  const { category, subject, message } = req.body;
  const ticket = await prisma.$transaction(async (tx) => {
    await lockSupportAccounts(tx, [ownerId]);
    return tx.supportTicket.create({
      data: { ownerId, category, subject, messages: { create: { authorId: ownerId, authorRole: "MEMBER", body: message } } },
      select: ticketSelect,
    });
  });
  res.status(201).json({ data: ticketData(ticket, ownerId) });
};

export function listSupportTickets(inbox: boolean): RequestHandler {
  return async (req, res) => {
    const readerId = res.locals.reader.id as string;
    const { page, q, category, status } = req.query as unknown as z.infer<typeof supportListSchema>;
    const base: Prisma.SupportTicketWhereInput = {
      ...scope(readerId, inbox),
      ...(category && { category }),
      ...(q && { OR: [{ subject: { contains: q, mode: "insensitive" } }, { id: { contains: q, mode: "insensitive" } }] }),
    };
    const data = await prisma.$transaction(async (tx) => {
      const groups = await tx.supportTicket.groupBy({ by: ["status"], where: base, _count: { _all: true } });
      const counts: Record<SupportStatus, number> = { WAITING_FOR_SUPPORT: 0, WAITING_FOR_MEMBER: 0, RESOLVED: 0 };
      for (const group of groups) counts[group.status] = group._count._all;
      const all = Object.values(counts).reduce((sum, count) => sum + count, 0);
      const tickets = await tx.supportTicket.findMany({
        where: { ...base, ...(status && { status }) },
        // PostgreSQL enum order: support, member, resolved; oldest activity first in each inbox group.
        orderBy: inbox ? [{ status: "asc" }, { updatedAt: "asc" }, { id: "asc" }] : [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        select: { ...ticketSelect, messages: { where: { kind: { not: "RESOLVED" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { body: true } } },
      });
      return {
        tickets: tickets.map(({ messages, ...ticket }) => ({ ...ticketData(ticket, readerId), preview: messages[0]?.body.slice(0, 240) ?? "" })),
        counts: { ...counts, all }, page, pageSize, total: status ? counts[status] : all,
      };
    }, { isolationLevel: "RepeatableRead" });
    res.json({ data });
  };
}

export function getSupportTicket(inbox: boolean): RequestHandler {
  return async (req, res) => {
    const readerId = res.locals.reader.id as string;
    const { before } = req.query as z.infer<typeof supportMessagesSchema>;
    const data = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findFirst({ where: { id: String(req.params.ticketId), ...scope(readerId, inbox) }, select: ticketSelect });
      if (!ticket) throw missing();
      const cursor = before ? await tx.supportMessage.findFirst({ where: { id: before, ticketId: ticket.id }, select: { id: true, createdAt: true } }) : null;
      if (before && !cursor) throw missing();
      const messages = await tx.supportMessage.findMany({
        where: {
          ticketId: ticket.id,
          ...(cursor && { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize + 1,
        select: { id: true, body: true, kind: true, createdAt: true, authorId: true, authorRole: true, author: { select: ownerSelect } },
      });
      const hasEarlier = messages.length > pageSize;
      const visible = messages.slice(0, pageSize).reverse();
      return {
        ticket: ticketData(ticket, readerId),
        messages: visible.map(({ authorId, authorRole, author, ...message }) => ({
          ...message, isSelf: authorId === readerId, role: authorRole === "MEMBER" ? "member" : "support",
          name: authorId ? author?.marketplaceCreator?.name || (authorRole === "MEMBER" ? "Member" : "Support") : "Deleted account",
          deleted: authorId === null,
        })),
        earlierCursor: hasEarlier ? visible[0].id : null,
      };
    }, { isolationLevel: "RepeatableRead" });
    res.json({ data });
  };
}

export function changeSupportTicket(inbox: boolean, resolve: boolean): RequestHandler {
  return async (req, res) => {
    const readerId = res.locals.reader.id as string;
    const ticket = await prisma.$transaction(async (tx) => {
      await lockSupportAccounts(tx, [readerId]);
      const current = await tx.supportTicket.findFirst({ where: { id: String(req.params.ticketId), ...scope(readerId, inbox) }, select: ticketSelect });
      if (!current) throw missing();
      await lockSupportAccounts(tx, [readerId, current.ownerId]);
      const isOwner = readerId === current.ownerId;
      if (resolve && current.status === "RESOLVED") return current;
      if (current.version !== req.body.version) throw conflict();
      if (!resolve && current.status === "RESOLVED" && !isOwner) {
        throw new SupportError(409, "SUPPORT_RESOLVED", "This ticket is resolved. Only its owner can reply and reopen it.");
      }
      const status = resolve ? "RESOLVED" : isOwner ? "WAITING_FOR_SUPPORT" : "WAITING_FOR_MEMBER";
      const changed = await tx.supportTicket.updateMany({ where: { id: current.id, version: req.body.version }, data: { status, version: { increment: 1 }, updatedAt: new Date() } });
      if (changed.count !== 1) throw conflict();
      await tx.supportMessage.create({
        data: {
          ticketId: current.id, authorId: readerId, authorRole: isOwner ? "MEMBER" : "ADMINISTRATOR",
          kind: resolve ? "RESOLVED" : current.status === "RESOLVED" ? "REOPENED" : "MESSAGE",
          body: resolve ? "" : req.body.message,
        },
      });
      return tx.supportTicket.findUniqueOrThrow({ where: { id: current.id }, select: ticketSelect });
    });
    res.json({ data: ticketData(ticket, readerId) });
  };
}
