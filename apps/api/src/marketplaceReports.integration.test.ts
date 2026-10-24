import { createHash, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("listing reports on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let product: { id: string; slug: string };
  let secondProduct: { id: string; slug: string };
  let owner: { id: string; cookie: string };
  let reporter: { id: string; cookie: string };
  let moderator: { id: string; cookie: string };
  let caseId: string;
  const run = randomUUID().slice(0, 8);
  const evidence = { reason: "MALICIOUS", explanation: "The installer uploads credentials to an unrelated server." };

  async function reader(label: string, staff = false, verified = true) {
    const token = randomUUID() + randomUUID();
    const user = await prisma.readerUser.create({ data: {
      email: `reports-${label}-${run}@integration.test`, emailVerifiedAt: verified ? new Date() : null,
      ...(staff ? { marketplaceRoleGrants: { create: { role: "MODERATOR" } } } : {}),
      sessions: { create: { tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } },
    } });
    return { id: user.id, cookie: `term_academy_reader=${token}` };
  }
  function post(path: string, actor: { cookie: string }) {
    return request(app).post(`/api/marketplace${path}`).set("Origin", origin).set("Cookie", actor.cookie);
  }
  function get(path: string, actor: { cookie: string }) {
    return request(app).get(`/api/marketplace${path}`).set("Cookie", actor.cookie);
  }
  const decision = { expectedVersion: 0, action: "TRIAGE", severity: "CRITICAL", reasonCode: "SOURCE_REVIEW", publicReason: "Credible source evidence is under investigation.", evidenceReference: "restricted-storage/source-evidence" };

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.CORS_ORIGINS = origin;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "false";
    ({ prisma } = await import("./lib/prisma.js"));
    app = (await import("./app.js")).createApp();
    owner = await reader("owner", true);
    reporter = await reader("reporter", false, false);
    moderator = await reader("moderator", true);
    const creator = await prisma.marketplaceCreator.create({ data: { name: "Report Test Creator", handle: `reports-${run}`, initials: "RC", bio: "Integration fixture", ownerUserId: owner.id } });
    const category = await prisma.marketplaceCategory.upsert({ where: { slug: "development" }, update: {}, create: { name: "Development", slug: "development" } });
    const data = {
      name: "Report Test Skill", type: "Skill", itemType: "SKILL" as const, outcome: "Tests reports", description: "Integration fixture",
      creatorId: creator.id, categoryId: category.id,
      version: "1.0.0", platforms: [], models: [], tags: [], benefits: [], installationSteps: [], previewFiles: [],
    };
    product = await prisma.marketplaceProduct.create({ data: { ...data, slug: `reports-first-${run}` } });
    secondProduct = await prisma.marketplaceProduct.create({ data: { ...data, slug: `reports-second-${run}` } });
    for (const target of [product, secondProduct]) {
      const snapshot = await prisma.marketplaceListingSnapshot.create({ data: { productId: target.id, revision: 1, schemaVersion: 0, digestSha256: "a".repeat(64), content: {}, createdByActor: "SYSTEM" } });
      await prisma.marketplaceProduct.update({ where: { id: target.id }, data: { approvedSnapshotId: snapshot.id, published: true, lifecycleState: "PUBLISHED" } });
    }
  });

  afterAll(async () => { await prisma?.$disconnect(); });

  it("serializes simultaneous retries into one receipt, case, original report and audit event", async () => {
    const results = await Promise.all(Array.from({ length: 3 }, () => post(`/products/${product.slug}/reports`, reporter).send(evidence)));
    expect(results.map((result) => result.status)).toEqual([202, 202, 202]);
    expect(new Set(results.map((result) => result.body.data.receiptId)).size).toBe(1);
    expect(results[0].body.data).toEqual({ accepted: true, receiptId: expect.any(String) });
    const cases = await prisma.marketplaceModerationCase.findMany({ where: { productId: product.id }, include: { reports: true, events: true } });
    expect(cases).toHaveLength(1);
    caseId = cases[0].id;
    expect(cases[0].reports).toHaveLength(1);
    expect(cases[0].events).toHaveLength(1);
    expect(cases[0].reports[0].explanation).toBe(evidence.explanation);
  });

  it("groups multiple reporters without punishment and enforces owner/reporter conflicts", async () => {
    const staffReporter = await reader("staff-reporter", true);
    const other = await reader("other-reporter");
    const results = await Promise.all([staffReporter, other].map((actor) => post(`/products/${product.slug}/reports`, actor).send(evidence)));
    expect(results.map((result) => result.status)).toEqual([202, 202]);
    expect(await prisma.marketplaceModerationCase.count({ where: { productId: product.id } })).toBe(1);
    const record = await prisma.marketplaceModerationCase.findUniqueOrThrow({ where: { id: caseId } });
    expect(record).toMatchObject({ state: "NEW", severity: "STANDARD", version: 0 });
    expect((await prisma.marketplaceProduct.findUniqueOrThrow({ where: { id: product.id } })).published).toBe(true);
    await get(`/moderation/cases/${caseId}`, owner).expect(404);
    await get(`/moderation/cases/${caseId}`, staffReporter).expect(404);
    const queue = await get("/moderation/cases", owner).expect(200);
    expect(queue.body.data.map((value: { id: string }) => value.id)).not.toContain(caseId);
    const detail = await get(`/moderation/cases/${caseId}`, moderator).expect(200);
    expect(JSON.stringify(detail.body)).not.toContain(reporter.id);
    const reports = await get(`/moderation/cases/${caseId}/reports?limit=1&page=2`, moderator).expect(200);
    expect(reports.body.data).toHaveLength(1);
    expect(reports.body.meta.total).toBe(3);
    expect(reports.body.data[0]).not.toHaveProperty("reporterId");
  });

  it("commits exactly one competing decision with an immutable original audit and evidence", async () => {
    const results = await Promise.all(Array.from({ length: 2 }, () => post(`/moderation/cases/${caseId}/triage`, moderator).send(decision)));
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const record = await prisma.marketplaceModerationCase.findUniqueOrThrow({ where: { id: caseId }, include: { events: true, reports: true } });
    expect(record).toMatchObject({ state: "TRIAGED", severity: "CRITICAL", version: 1 });
    const actions = record.events.filter((event) => event.action === "TRIAGE");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ actorUserId: moderator.id, previousState: "NEW", resultingState: "TRIAGED", previousSeverity: "STANDARD", resultingSeverity: "CRITICAL", reasonCode: "SOURCE_REVIEW", evidenceReference: decision.evidenceReference });
    const history = await get(`/moderation/cases/${caseId}/events?limit=1&page=2`, moderator).expect(200);
    expect(history.body.meta).toMatchObject({ total: 4, totalPages: 4 });
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0]).not.toHaveProperty("actorUserId");
    await expect(prisma.marketplaceModerationCaseEvent.update({ where: { id: actions[0].id }, data: { reasonCode: "REWRITE" } })).rejects.toThrow();
    await expect(prisma.marketplaceModerationCaseEvent.delete({ where: { id: actions[0].id } })).rejects.toThrow();
    await expect(prisma.marketplaceReport.update({ where: { id: record.reports[0].id }, data: { explanation: "Rewritten original report" } })).rejects.toThrow();
  });

  it("retains dismissal history while allowing later evidence to start a new case", async () => {
    await post(`/moderation/cases/${caseId}/triage`, moderator).send({ ...decision, expectedVersion: 1, action: "DISMISS", publicReason: "The source evidence does not establish a violation." }).expect(200);
    await post(`/moderation/cases/${caseId}/triage`, moderator).send({ ...decision, expectedVersion: 2 }).expect(409);
    const next = await reader("new-evidence");
    await post(`/products/${product.slug}/reports`, next).send(evidence).expect(202);
    const cases = await prisma.marketplaceModerationCase.findMany({ where: { productId: product.id } });
    expect(cases).toHaveLength(2);
    expect(cases.find((value) => value.id === caseId)).toMatchObject({ state: "DISMISSED", openKey: null, version: 2 });
    expect(cases.find((value) => value.id !== caseId)).toMatchObject({ state: "NEW", openKey: `${product.id}:MALICIOUS` });
  });

  it("keeps the ten-report account quota under concurrent requests across different targets", async () => {
    const limited = await reader("limited");
    const reasons = ["MALICIOUS", "MISLEADING", "BROKEN_OR_ABANDONED", "SOURCE_COMPROMISE", "IMPERSONATION", "SPAM_OR_ABUSE"];
    const results = await Promise.all([product, secondProduct].flatMap((target) => reasons.map((reason) => post(`/products/${target.slug}/reports`, limited).send({ ...evidence, reason }))));
    expect(results.filter((result) => result.status === 202)).toHaveLength(10);
    expect(results.filter((result) => result.status === 429 && result.body.error.code === "REPORT_RATE_LIMITED")).toHaveLength(2);
    expect(await prisma.marketplaceReport.count({ where: { reporterId: limited.id } })).toBe(10);
  });

  it("rechecks revoked staff roles on the existing session", async () => {
    await prisma.marketplaceRoleGrant.updateMany({ where: { userId: moderator.id }, data: { revokedAt: new Date() } });
    await get(`/moderation/cases/${caseId}`, moderator).expect(403);
    await post(`/moderation/cases/${caseId}/triage`, moderator).send(decision).expect(403);
  });
});
