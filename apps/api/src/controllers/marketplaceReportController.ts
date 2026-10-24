import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { marketplaceReportSchema, moderationCaseQuerySchema, moderationCaseTriageSchema } from "../validation/schemas.js";

class CaseRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

function respondToCaseError(res: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
    res.setHeader("Retry-After", "1");
    res.status(503).json({ error: { code: "REPORT_SERVICE_BUSY", message: "The reporting service is busy; retry shortly" } });
    return;
  }
  if (!(error instanceof CaseRequestError)) throw error;
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
}

function staffCaseWhere(userId: string): Prisma.MarketplaceModerationCaseWhereInput {
  return { NOT: { product: { creator: { ownerUserId: userId } } }, reports: { none: { reporterId: userId } } };
}

const caseSummarySelect = {
  id: true, productId: true, reason: true, state: true, severity: true, version: true,
  publicReason: true, createdAt: true, updatedAt: true,
  product: { select: { name: true, slug: true } },
  _count: { select: { reports: true } },
} satisfies Prisma.MarketplaceModerationCaseSelect;

const caseEventSelect = {
  id: true, action: true, actorType: true, previousState: true, resultingState: true,
  previousSeverity: true, resultingSeverity: true, reasonCode: true, publicReason: true,
  evidenceReference: true, correlationId: true, createdAt: true,
} satisfies Prisma.MarketplaceModerationCaseEventSelect;

export async function reportMarketplaceListing(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const { reason, explanation } = req.body as z.infer<typeof marketplaceReportSchema>;
  try {
    const receipt = await prisma.$transaction(async (tx) => {
      // Serialize the account quota and the target's open-case key across API instances.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 5))`;
      const product = await tx.marketplaceProduct.findFirst({
        where: { slug: String(req.params.slug), published: true, lifecycleState: { notIn: ["SUSPENDED", "ARCHIVED"] } },
        select: { id: true },
      });
      if (!product) throw new CaseRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      const openKey = `${product.id}:${reason}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${openKey}, 6))`;
      const existingCase = await tx.marketplaceModerationCase.findUnique({ where: { openKey } });
      if (existingCase) {
        const existingReport = await tx.marketplaceReport.findUnique({ where: { caseId_reporterId: { caseId: existingCase.id, reporterId: userId } }, select: { id: true } });
        if (existingReport) return existingReport;
      }
      const recent = await tx.marketplaceReport.count({ where: { reporterId: userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
      if (recent >= 10) throw new CaseRequestError(429, "REPORT_RATE_LIMITED", "You can submit up to ten new reports per hour; try again later");
      const caseRecord = existingCase ?? await tx.marketplaceModerationCase.create({ data: { productId: product.id, reason, openKey } });
      const report = await tx.marketplaceReport.create({ data: { caseId: caseRecord.id, reporterId: userId, explanation }, select: { id: true } });
      await tx.marketplaceModerationCaseEvent.create({ data: {
        caseId: caseRecord.id, actorUserId: userId, actorType: "READER", action: "REPORT_RECEIVED",
        previousState: existingCase?.state ?? null, resultingState: caseRecord.state,
        previousSeverity: existingCase?.severity ?? null, resultingSeverity: caseRecord.severity,
        reasonCode: reason, correlationId: randomUUID(),
      } });
      return report;
    }, { maxWait: 10000 });
    // A reporter receives only their own opaque receipt, never the case or other reporters.
    res.status(202).json({ data: { receiptId: receipt.id, accepted: true } });
  } catch (error) {
    respondToCaseError(res, error);
  }
}

export async function listMarketplaceReportCases(req: Request, res: Response) {
  const { state, page, limit } = req.query as unknown as z.infer<typeof moderationCaseQuerySchema>;
  const where: Prisma.MarketplaceModerationCaseWhereInput = { ...staffCaseWhere(res.locals.reader.id), ...(state ? { state } : {}) };
  const [cases, total] = await prisma.$transaction([
    prisma.marketplaceModerationCase.findMany({ where, select: caseSummarySelect, orderBy: [{ severity: "desc" }, { createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.marketplaceModerationCase.count({ where }),
  ]);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: cases, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getMarketplaceReportCase(req: Request, res: Response) {
  const record = await prisma.marketplaceModerationCase.findFirst({
    where: { id: String(req.params.id), ...staffCaseWhere(res.locals.reader.id) },
    select: {
      ...caseSummarySelect,
      // The detail includes recent history; full evidence and history have bounded paging endpoints.
      events: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50, select: caseEventSelect },
    },
  });
  if (!record) {
    res.status(404).json({ error: { code: "CASE_NOT_FOUND", message: "Moderation case not found" } });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: record });
}

export async function listMarketplaceCaseReports(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as z.infer<typeof moderationCaseQuerySchema>;
  const record = await prisma.marketplaceModerationCase.findFirst({ where: { id: String(req.params.id), ...staffCaseWhere(res.locals.reader.id) }, select: { id: true, _count: { select: { reports: true } } } });
  if (!record) {
    res.status(404).json({ error: { code: "CASE_NOT_FOUND", message: "Moderation case not found" } });
    return;
  }
  const reports = await prisma.marketplaceReport.findMany({
    where: { caseId: record.id }, select: { id: true, explanation: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit,
  });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: reports, meta: { page, limit, total: record._count.reports, totalPages: Math.ceil(record._count.reports / limit) } });
}

export async function triageMarketplaceReportCase(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const input = req.body as z.infer<typeof moderationCaseTriageSchema>;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const key = await tx.marketplaceModerationCase.findFirst({ where: { id: String(req.params.id), ...staffCaseWhere(userId) }, select: { productId: true, reason: true } });
      if (!key) throw new CaseRequestError(404, "CASE_NOT_FOUND", "Moderation case not found");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${key.productId}:${key.reason}`}, 6))`;
      const record = await tx.marketplaceModerationCase.findFirst({ where: { id: String(req.params.id), ...staffCaseWhere(userId) } });
      if (!record) throw new CaseRequestError(404, "CASE_NOT_FOUND", "Moderation case not found");
      const state = input.action === "DISMISS" ? "DISMISSED" : input.action === "INVESTIGATE" ? "INVESTIGATING" : "TRIAGED";
      if (["ACTIONED", "DISMISSED"].includes(record.state)) throw new CaseRequestError(409, "CASE_CLOSED", "This case is resolved; its decision cannot be overwritten");
      const changed = await tx.marketplaceModerationCase.updateMany({
        where: { id: record.id, version: input.expectedVersion, ...staffCaseWhere(userId) },
        data: { state, severity: input.severity, publicReason: input.publicReason, version: { increment: 1 }, ...(state === "DISMISSED" ? { openKey: null } : {}) },
      });
      if (changed.count !== 1) throw new CaseRequestError(409, "CASE_VERSION_CONFLICT", "The case changed; reload it before trying again");
      const correlationId = randomUUID();
      await tx.marketplaceModerationCaseEvent.create({ data: {
        caseId: record.id, actorUserId: userId, actorType: res.locals.reader.marketplaceRoles.includes("administrator") ? "ADMINISTRATOR" : "MODERATOR",
        action: input.action, previousState: record.state, resultingState: state,
        previousSeverity: record.severity, resultingSeverity: input.severity,
        reasonCode: input.reasonCode, publicReason: input.publicReason, evidenceReference: input.evidenceReference, correlationId,
      } });
      return { id: record.id, state, severity: input.severity, version: input.expectedVersion + 1, correlationId };
    });
    res.json({ data: updated });
  } catch (error) {
    respondToCaseError(res, error);
  }
}

export async function listMarketplaceCaseEvents(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as z.infer<typeof moderationCaseQuerySchema>;
  const record = await prisma.marketplaceModerationCase.findFirst({ where: { id: String(req.params.id), ...staffCaseWhere(res.locals.reader.id) }, select: { id: true, _count: { select: { events: true } } } });
  if (!record) {
    res.status(404).json({ error: { code: "CASE_NOT_FOUND", message: "Moderation case not found" } });
    return;
  }
  const events = await prisma.marketplaceModerationCaseEvent.findMany({
    where: { caseId: record.id }, select: caseEventSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit,
  });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: events, meta: { page, limit, total: record._count.events, totalPages: Math.ceil(record._count.events / limit) } });
}
