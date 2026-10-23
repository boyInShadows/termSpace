import cookieParser from "cookie-parser";
import { Prisma } from "@prisma/client";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  session: vi.fn(), product: vi.fn(), caseFind: vi.fn(), caseUnique: vi.fn(), caseCreate: vi.fn(),
  caseList: vi.fn(), caseCount: vi.fn(), caseUpdate: vi.fn(), reportFind: vi.fn(), reportCount: vi.fn(),
  reportCreate: vi.fn(), reportList: vi.fn(), eventCreate: vi.fn(), eventList: vi.fn(), lock: vi.fn(), transaction: vi.fn(),
}));
vi.mock("../lib/prisma.js", () => {
  const tx = {
    marketplaceProduct: { findFirst: db.product },
    marketplaceModerationCase: { findFirst: db.caseFind, findUnique: db.caseUnique, create: db.caseCreate, findMany: db.caseList, count: db.caseCount, updateMany: db.caseUpdate },
    marketplaceReport: { findUnique: db.reportFind, count: db.reportCount, create: db.reportCreate, findMany: db.reportList },
    marketplaceModerationCaseEvent: { create: db.eventCreate, findMany: db.eventList }, $executeRaw: db.lock,
  };
  return { prisma: { ...tx, readerSession: { findFirst: db.session }, $transaction: db.transaction.mockImplementation((op) => typeof op === "function" ? op(tx) : Promise.all(op)) } };
});
import marketplaceRoutes from "../routes/marketplaceRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { csrfProtection } from "../middleware/security.js";

const app = express();
app.use(express.json(), cookieParser(), csrfProtection);
app.use("/api/marketplace", marketplaceRoutes);
app.use(errorHandler);
const cookie = `term_academy_reader=${"a".repeat(40)}`;
const report = { reason: "MALICIOUS", explanation: "The installation script sends credentials to an unrelated host." };
const record = { id: "case-1", productId: "product-1", reason: "MALICIOUS", openKey: "product-1:MALICIOUS", state: "NEW", severity: "STANDARD", version: 0 };
const triage = { expectedVersion: 0, action: "TRIAGE", severity: "HIGH", reasonCode: "SOURCE_REVIEW", publicReason: "The source is being investigated.", evidenceReference: "restricted-evidence/123" };
function signed(method: "post" | "get", path: string) {
  return request(app)[method](`/api/marketplace${path}`).set("Cookie", cookie).set("Origin", "http://localhost:3000");
}
function session(roles: string[] = []) {
  db.session.mockResolvedValue({ id: "session-1", user: { id: "reader-1", email: "private@example.test", emailVerifiedAt: new Date(), marketplaceRoleGrants: roles.map((role) => ({ role })) } });
}

describe("listing report intake and case triage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "false";
    process.env.CORS_ORIGINS = "http://localhost:3000";
    session();
    db.product.mockResolvedValue({ id: "product-1" });
    db.caseUnique.mockResolvedValue(null);
    db.caseCreate.mockResolvedValue(record);
    db.caseFind.mockResolvedValue(record);
    db.caseList.mockResolvedValue([]);
    db.caseCount.mockResolvedValue(0);
    db.caseUpdate.mockResolvedValue({ count: 1 });
    db.reportFind.mockResolvedValue(null);
    db.reportCount.mockResolvedValue(0);
    db.reportCreate.mockResolvedValue({ id: "receipt-1" });
    db.reportList.mockResolvedValue([]);
    db.eventCreate.mockResolvedValue({});
    db.eventList.mockResolvedValue([]);
    db.lock.mockResolvedValue(0);
  });

  it("requires an active authenticated reader and protects cookie writes from CSRF", async () => {
    db.session.mockResolvedValue(null);
    await signed("post", "/products/public-skill/reports").send(report).expect(401);
    await request(app).post("/api/marketplace/products/public-skill/reports").set("Cookie", cookie).set("Origin", "https://attacker.test").send(report).expect(403);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("accepts safety evidence from an unverified reader without exposing case or account data", async () => {
    db.session.mockResolvedValue({ id: "session-1", user: { id: "reader-1", email: "private@example.test", emailVerifiedAt: null, marketplaceRoleGrants: [] } });
    const result = await signed("post", "/products/public-skill/reports").send(report).expect(202);
    expect(result.body).toEqual({ data: { receiptId: "receipt-1", accepted: true } });
    expect(db.product).toHaveBeenCalledWith({ where: { slug: "public-skill", published: true, lifecycleState: { notIn: ["SUSPENDED", "ARCHIVED"] } }, select: { id: true } });
    expect(db.reportCreate).toHaveBeenCalledWith({ data: { caseId: "case-1", reporterId: "reader-1", explanation: report.explanation }, select: { id: true } });
    expect(db.eventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ actorType: "READER", action: "REPORT_RECEIVED", resultingState: "NEW", resultingSeverity: "STANDARD", reasonCode: "MALICIOUS" }) });
    expect(db.caseUpdate).not.toHaveBeenCalled();
  });

  it.each([
    { ...report, reason: "UNSUPPORTED" }, { ...report, explanation: "short" },
    { ...report, explanation: "x".repeat(4001) }, { ...report, severity: "CRITICAL" },
  ])("validates report reason, bounded evidence and forbids staff fields: %j", async (body) => {
    await signed("post", "/products/public-skill/reports").send(body).expect(400);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("returns 404 for unavailable or private targets without recording evidence", async () => {
    db.product.mockResolvedValue(null);
    await signed("post", "/products/private-skill/reports").send(report).expect(404);
    expect(db.reportCreate).not.toHaveBeenCalled();
  });

  it("deduplicates a reader's retry without replacing original evidence or charging their quota", async () => {
    db.caseUnique.mockResolvedValue(record);
    db.reportFind.mockResolvedValue({ id: "receipt-original" });
    const result = await signed("post", "/products/public-skill/reports").send(report).expect(202);
    expect(result.body.data.receiptId).toBe("receipt-original");
    expect(db.reportCount).not.toHaveBeenCalled();
    expect(db.eventCreate).not.toHaveBeenCalled();
    expect(db.reportCreate).not.toHaveBeenCalled();
  });

  it("groups different reporters into an existing case without increasing its severity", async () => {
    db.caseUnique.mockResolvedValue({ ...record, state: "INVESTIGATING", severity: "HIGH" });
    await signed("post", "/products/public-skill/reports").send(report).expect(202);
    expect(db.caseCreate).not.toHaveBeenCalled();
    expect(db.caseUpdate).not.toHaveBeenCalled();
    expect(db.eventCreate.mock.calls[0][0].data).toMatchObject({ previousState: "INVESTIGATING", resultingState: "INVESTIGATING", previousSeverity: "HIGH", resultingSeverity: "HIGH" });
  });

  it("enforces a transactionally checked per-account hourly quota", async () => {
    db.reportCount.mockResolvedValue(10);
    const result = await signed("post", "/products/public-skill/reports").send(report).expect(429);
    expect(result.body.error.code).toBe("REPORT_RATE_LIMITED");
    expect(db.caseCreate).not.toHaveBeenCalled();
    expect(db.reportCreate).not.toHaveBeenCalled();
    expect(db.lock).toHaveBeenCalledTimes(2);
  });

  it("returns a retryable service error if database transaction admission times out", async () => {
    db.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Unable to start a transaction", { code: "P2028", clientVersion: "6.12.0" }));
    const result = await signed("post", "/products/public-skill/reports").send(report).expect(503);
    expect(result.body.error.code).toBe("REPORT_SERVICE_BUSY");
    expect(result.headers["retry-after"]).toBe("1");
    expect(db.reportCreate).not.toHaveBeenCalled();
  });

  it("denies ordinary readers and unverified staff access to private cases", async () => {
    await signed("get", "/moderation/cases").expect(403);
    session(["MODERATOR"]);
    db.session.mockResolvedValue({ id: "session-1", user: { id: "reader-1", email: "private@example.test", emailVerifiedAt: null, marketplaceRoleGrants: [{ role: "MODERATOR" }] } });
    await signed("get", "/moderation/cases/case-1").expect(403);
    expect(db.caseFind).not.toHaveBeenCalled();
  });

  it("scopes and bounds the private staff queue, excluding owners and reporter conflicts", async () => {
    session(["MODERATOR"]);
    const result = await signed("get", "/moderation/cases?state=NEW&page=2&limit=3").expect(200);
    expect(result.headers["cache-control"]).toBe("private, no-store");
    expect(db.caseList.mock.calls[0][0]).toMatchObject({ where: { state: "NEW", NOT: { product: { creator: { ownerUserId: "reader-1" } } }, reports: { none: { reporterId: "reader-1" } } }, skip: 3, take: 3 });
    expect(db.caseList.mock.calls[0][0].select).not.toHaveProperty("reports");
    await signed("get", "/moderation/cases?limit=49").expect(400);
  });

  it("does not return reporter identity, email, or private actor identifiers in case evidence", async () => {
    session(["MODERATOR"]);
    db.caseFind.mockResolvedValue({ id: "case-1", _count: { reports: 1, events: 51 } });
    db.reportList.mockResolvedValue([{ id: "receipt-1", explanation: "Bounded original evidence", createdAt: new Date() }]);
    await signed("get", "/moderation/cases/case-1").expect(200);
    expect(db.caseFind.mock.calls[0][0].select.events.select).not.toHaveProperty("actorUserId");
    const result = await signed("get", "/moderation/cases/case-1/reports").expect(200);
    expect(db.reportList.mock.calls[0][0].select).toEqual({ id: true, explanation: true, createdAt: true });
    expect(JSON.stringify(result.body)).not.toMatch(/reader-1|private@example/);
    const history = await signed("get", "/moderation/cases/case-1/events?page=2&limit=48").expect(200);
    expect(history.body.meta).toEqual({ page: 2, limit: 48, total: 51, totalPages: 2 });
    expect(db.eventList.mock.calls[0][0]).toMatchObject({ where: { caseId: "case-1" }, skip: 48, take: 48 });
    expect(db.eventList.mock.calls[0][0].select).not.toHaveProperty("actorUserId");
  });

  it("returns indistinguishable 404s for missing, self-owned, or self-reported cases", async () => {
    session(["MODERATOR"]);
    db.caseFind.mockResolvedValue(null);
    for (const suffix of ["", "/reports", "/events"]) await signed("get", `/moderation/cases/case-1${suffix}`).expect(404);
    await signed("post", "/moderation/cases/case-1/triage").send(triage).expect(404);
    expect(db.caseUpdate).not.toHaveBeenCalled();
  });

  it("atomically changes severity and appends the actor, states, reason, evidence reference and correlation", async () => {
    session(["MODERATOR"]);
    const result = await signed("post", "/moderation/cases/case-1/triage").send(triage).expect(200);
    expect(result.body.data).toMatchObject({ state: "TRIAGED", severity: "HIGH", version: 1 });
    expect(db.eventCreate.mock.calls[0][0].data).toMatchObject({ caseId: "case-1", actorUserId: "reader-1", actorType: "MODERATOR", action: "TRIAGE", previousState: "NEW", resultingState: "TRIAGED", previousSeverity: "STANDARD", resultingSeverity: "HIGH", evidenceReference: "restricted-evidence/123", correlationId: result.body.data.correlationId });
    expect(db.caseFind).toHaveBeenCalledTimes(2);
  });

  it("rejects concurrent decisions without an audit event", async () => {
    session(["MODERATOR"]);
    db.caseUpdate.mockResolvedValue({ count: 0 });
    const result = await signed("post", "/moderation/cases/case-1/triage").send(triage).expect(409);
    expect(result.body.error.code).toBe("CASE_VERSION_CONFLICT");
    expect(db.eventCreate).not.toHaveBeenCalled();
  });

  it("releases the deduplication key when dismissing and refuses to overwrite resolved decisions", async () => {
    session(["ADMINISTRATOR"]);
    await signed("post", "/moderation/cases/case-1/triage").send({ ...triage, action: "DISMISS" }).expect(200);
    expect(db.caseUpdate.mock.calls[0][0].data).toMatchObject({ state: "DISMISSED", openKey: null });
    expect(db.eventCreate.mock.calls[0][0].data.actorType).toBe("ADMINISTRATOR");
    db.caseFind.mockResolvedValue({ ...record, state: "DISMISSED" });
    await signed("post", "/moderation/cases/case-1/triage").send(triage).expect(409);
    expect(db.eventCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported actions and unbounded private evidence before a write", async () => {
    session(["MODERATOR"]);
    await signed("post", "/moderation/cases/case-1/triage").send({ ...triage, action: "SUSPEND" }).expect(400);
    await signed("post", "/moderation/cases/case-1/triage").send({ ...triage, evidenceReference: "x".repeat(201) }).expect(400);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
