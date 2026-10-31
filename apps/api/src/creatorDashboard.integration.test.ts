import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";
const day = 86_400_000;

describe.skipIf(!databaseUrl)("creator dashboard reviews and acquisition trend on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let auth: typeof import("./middleware/auth.js");
  const run = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const productIds: string[] = [];
  const creatorIds: string[] = [];
  let categoryId = "";
  let ownerCookie = "";
  let mineId = "";
  let otherProductId = "";
  let emptyCookie = "";

  async function creator(label: string) {
    const user = await prisma.readerUser.create({ data: { email: `${label}-${run}@studio.test`, emailVerifiedAt: new Date() } });
    userIds.push(user.id);
    await prisma.marketplaceRoleGrant.create({ data: { userId: user.id, role: "CREATOR" } });
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: user.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    const profile = await prisma.marketplaceCreator.create({ data: { name: `Studio ${label}`, handle: `studio-${label}-${run}`, initials: "ST", bio: "Fixture", ownerUserId: user.id } });
    creatorIds.push(profile.id);
    return { id: user.id, creatorId: profile.id, cookie: `${auth.READER_SESSION_COOKIE}=${token}` };
  }

  async function product(creatorId: string, label: string) {
    const created = await prisma.marketplaceProduct.create({
      data: {
        name: `Studio ${label}`, slug: `studio-${label}-${run}`, type: "Skill", itemType: "SKILL", outcome: "Fixture", description: "Fixture", creatorId, categoryId,
        version: "1.0.0", platforms: [], models: [], tags: [], benefits: [], installationSteps: [], previewFiles: [],
      },
    });
    productIds.push(created.id);
    return created.id;
  }

  async function buyer(label: string) {
    const user = await prisma.readerUser.create({ data: { email: `${label}-${run}@studio.test`, emailVerifiedAt: new Date() } });
    userIds.push(user.id);
    return user.id;
  }

  const order = (userId: string, productId: string, daysAgo: number, status = "completed") => prisma.marketplaceOrder.create({
    data: { userId, productId, idempotencyKey: `${run}-${userId}-${productId}`, amountMinor: 0, currency: "USD", status, createdAt: new Date(Date.now() - daysAgo * day) },
  });
  const review = (userId: string, productId: string, author: string, rating: number, daysAgo: number, extra: object = {}) => prisma.marketplaceReview.create({
    data: { userId, productId, author, rating, body: `${author} says ${rating}`, published: true, verifiedPurchase: true, createdAt: new Date(Date.now() - daysAgo * day), ...extra },
  });
  const dashboard = (cookie: string) => request(app).get("/api/marketplace/creator/dashboard").set("Cookie", cookie).set("Origin", origin);

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    ({ prisma } = await import("./lib/prisma.js"));
    auth = await import("./middleware/auth.js");
    app = (await import("./app.js")).createApp();
    categoryId = (await prisma.marketplaceCategory.upsert({ where: { slug: "development" }, update: {}, create: { name: "Development", slug: "development" } })).id;

    const mine = await creator("mine");
    ownerCookie = mine.cookie;
    mineId = await product(mine.creatorId, "mine");
    const other = await creator("other");
    otherProductId = await product(other.creatorId, "other");
    emptyCookie = (await creator("empty")).cookie;

    const buyers = await Promise.all(["a", "b", "c", "d", "e", "f"].map((label) => buyer(`buyer-${label}`)));
    // Inside the 30-day window: two completed; outside it: one; and one that never completed.
    await order(buyers[0], mineId, 2);
    await order(buyers[1], mineId, 29);
    await order(buyers[2], mineId, 45);
    await order(buyers[3], mineId, 1, "pending");
    await order(buyers[0], otherProductId, 1);
    // Four visible reviews (the newest three are shown), one hidden, one unpublished.
    await review(buyers[0], mineId, "Ada", 5, 1);
    await review(buyers[1], mineId, "Lin", 4, 2);
    await review(buyers[2], mineId, "Kai", 3, 3);
    await review(buyers[3], mineId, "Old", 2, 9);
    await review(buyers[4], mineId, "Hidden", 1, 0, { hiddenAt: new Date(), hiddenReason: "abuse", published: false });
    await review(buyers[5], mineId, "Draft", 1, 0, { published: false });
    await review(buyers[0], otherProductId, "Elsewhere", 5, 0);
  }, 60_000);

  afterAll(async () => {
    if (prisma) {
      try {
        await prisma.marketplaceReview.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.marketplaceOrder.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.marketplaceProduct.deleteMany({ where: { id: { in: productIds } } });
        await prisma.marketplaceCreator.deleteMany({ where: { id: { in: creatorIds } } });
        await prisma.readerUser.deleteMany({ where: { id: { in: userIds } } });
      } catch { /* a leftover fixture row never fails the suite */ }
      await prisma.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  it("counts a listing's completed acquisitions from the last 30 days only", async () => {
    const response = await dashboard(ownerCookie);
    expect(response.status).toBe(200);
    expect(response.body.data.listings).toHaveLength(1);
    expect(response.body.data.listings[0]).toMatchObject({ id: mineId, acquisitionCount: 3, acquisitionsLast30Days: 2 });
  });

  it("shows the newest three visible reviews and never a hidden, unpublished or foreign one", async () => {
    const reviews = (await dashboard(ownerCookie)).body.data.listings[0].recentReviews;
    expect(reviews.map((item: { author: string }) => item.author)).toEqual(["Ada", "Lin", "Kai"]);
    expect(reviews[0]).toEqual({ id: expect.any(String), author: "Ada", rating: 5, body: "Ada says 5", createdAt: expect.any(String) });
    const raw = JSON.stringify(reviews);
    for (const hidden of ["Hidden", "Draft", "Elsewhere", "Old"]) expect(raw).not.toContain(hidden);
  });

  it("returns only the caller's own listings and keeps the empty case empty", async () => {
    expect(JSON.stringify((await dashboard(ownerCookie)).body)).not.toContain(otherProductId);
    const empty = await dashboard(emptyCookie);
    expect(empty.status).toBe(200);
    expect(empty.body.data.listings).toEqual([]);
    expect(empty.body.meta.total).toBe(0);
  });

  it("requires a creator", async () => {
    expect((await request(app).get("/api/marketplace/creator/dashboard").set("Origin", origin)).status).toBe(401);
  });
});
