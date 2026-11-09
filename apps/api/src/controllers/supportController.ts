import type { Request, Response } from "express";
import type { SupportStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { prepareSupportImages, readSupportImage, removeSupportImages } from "../lib/supportImages.js";
import { notifySupportParticipants } from "../lib/supportNotifications.js";
import { requireActiveSupportAccounts } from "../lib/supportAccess.js";

const ticketSelect = { id: true, category: true, subject: true, status: true, version: true, createdAt: true, updatedAt: true } as const;
const messageSelect = { id: true, body: true, authorRole: true, createdAt: true, attachments: { select: { id: true, bytes: true, width: true, height: true } } } as const;

function ticketScope(req: Request, res: Response) {
  return { id: String(req.params.id), ...(res.locals.supportAdmin ? {} : { ownerId: String(res.locals.reader.id) }) };
}

function missingTicket(res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
}

function staleTicket(res: Response) {
  res.status(409).json({ error: { code: "SUPPORT_CONFLICT", message: "This ticket changed. Review the latest messages and try again." } });
}

export async function listSupportTickets(req: Request, res: Response) {
  const page = Number(req.query.page);
  const tickets = await prisma.supportTicket.findMany({
    where: res.locals.supportAdmin
      ? { ...(req.query.status ? { status: req.query.status as SupportStatus } : {}) }
      : { ownerId: String(res.locals.reader.id) },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: ticketSelect, skip: (page - 1) * 20, take: 21,
  });
  res.json({ data: { tickets: tickets.slice(0, 20), hasMore: tickets.length > 20, page } });
}

export async function createSupportTicket(req: Request, res: Response) {
  const { category, subject, body } = req.body;
  const ownerId = String(res.locals.reader.id);
  const images = await prepareSupportImages(req.files as Express.Multer.File[] | undefined);
  const ticket = await prisma.$transaction(async tx => {
    await requireActiveSupportAccounts(tx, [ownerId]);
    const created = await tx.supportTicket.create({
      data: { ownerId, category, subject, messages: { create: { body, authorId: ownerId, authorRole: "MEMBER", ...(images.length ? { attachments: { create: images } } : {}) } } },
      select: { id: true },
    });
    await notifySupportParticipants(tx, { ticketId: created.id, ownerId, actorId: ownerId, type: "TICKET_CREATED", audience: "staff" });
    return created;
  }).catch(async error => { await removeSupportImages(images.map(image => image.storageKey)); throw error; });
  res.status(201).json({ data: ticket });
}

export async function getSupportTicket(req: Request, res: Response) {
  const ticket = await prisma.supportTicket.findFirst({
    where: ticketScope(req, res), select: ticketSelect,
  });
  if (!ticket) {
    missingTicket(res);
    return;
  }
  const page = Number(req.query.page);
  const messages = await prisma.supportMessage.findMany({
    where: { ticketId: ticket.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: messageSelect, skip: (page - 1) * 50, take: 51,
  });
  res.json({ data: { ...ticket, messages: messages.slice(0, 50).reverse(), hasMore: messages.length > 50, page } });
}

export async function replySupportTicket(req: Request, res: Response) {
  const scope = ticketScope(req, res);
  const ticket = await prisma.supportTicket.findFirst({ where: scope, select: { id: true, ownerId: true, status: true } });
  if (!ticket) { missingTicket(res); return; }
  if (res.locals.supportAdmin && ticket.status === "RESOLVED") {
    res.status(409).json({ error: { code: "TICKET_RESOLVED", message: "Only a new member reply can reopen a resolved ticket." } });
    return;
  }
  const images = await prepareSupportImages(req.files as Express.Multer.File[] | undefined);
  let saved: boolean;
  try { saved = await prisma.$transaction(async (tx) => {
    await requireActiveSupportAccounts(tx, [ticket.ownerId, String(res.locals.reader.id)]);
    const updated = await tx.supportTicket.updateMany({
      where: { ...scope, version: req.body.expectedVersion, ...(res.locals.supportAdmin ? { status: { not: "RESOLVED" as const } } : {}) },
      data: { status: res.locals.supportAdmin ? "WAITING_FOR_MEMBER" : "WAITING_FOR_SUPPORT", version: { increment: 1 } },
    });
    if (!updated.count) return false;
    await tx.supportMessage.create({ data: {
      ticketId: ticket.id, authorId: String(res.locals.reader.id),
      authorRole: res.locals.supportAdmin ? "ADMINISTRATOR" : "MEMBER", body: req.body.body,
      ...(images.length ? { attachments: { create: images } } : {}),
    } });
    await notifySupportParticipants(tx, {
      ticketId: ticket.id, ownerId: ticket.ownerId, actorId: String(res.locals.reader.id),
      type: res.locals.supportAdmin ? "STAFF_REPLIED" : "MEMBER_REPLIED", audience: res.locals.supportAdmin ? "member" : "staff",
    });
    return true;
  }); } catch (error) { await removeSupportImages(images.map(image => image.storageKey)); throw error; }
  if (!saved) { await removeSupportImages(images.map(image => image.storageKey)); staleTicket(res); return; }
  res.status(201).json({ data: { saved: true } });
}

export async function resolveSupportTicket(req: Request, res: Response) {
  const scope = ticketScope(req, res);
  const ticket = await prisma.supportTicket.findFirst({ where: scope, select: { id: true, ownerId: true, status: true } });
  if (!ticket) { missingTicket(res); return; }
  if (ticket.status === "RESOLVED") { res.json({ data: { saved: true } }); return; }
  const saved = await prisma.$transaction(async tx => {
    await requireActiveSupportAccounts(tx, [ticket.ownerId, String(res.locals.reader.id)]);
    const updated = await tx.supportTicket.updateMany({
      where: { ...scope, version: req.body.expectedVersion, status: { not: "RESOLVED" } }, data: { status: "RESOLVED", version: { increment: 1 } },
    });
    if (!updated.count) return false;
    await notifySupportParticipants(tx, {
      ticketId: ticket.id, ownerId: ticket.ownerId, actorId: String(res.locals.reader.id), type: "RESOLVED", audience: res.locals.supportAdmin ? "member" : "staff",
    });
    return true;
  });
  if (!saved) { staleTicket(res); return; }
  res.json({ data: { saved: true } });
}

export async function getSupportAttachment(req: Request, res: Response) {
  const attachment = await prisma.supportAttachment.findFirst({
    where: { id: String(req.params.id), message: { ticket: res.locals.supportAdmin ? {} : { ownerId: String(res.locals.reader.id) } } },
    select: { storageKey: true },
  });
  if (!attachment) { missingTicket(res); return; }
  let buffer: Buffer;
  try { buffer = await readSupportImage(attachment.storageKey); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { missingTicket(res); return; } throw error; }
  res.set({ "Content-Type": "image/webp", "Content-Disposition": 'inline; filename="screenshot.webp"', "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" });
  res.send(buffer);
}
