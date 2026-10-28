import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("library sort, filter and search, and catalog lookup by slug, on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let auth: typeof import("./middleware/auth.js");
  const run = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let creatorId = "";
  let categoryId = "";
  let ownerId = "";
  let cookie = "";
  const productIds: string[] = [];
  const slug = (label: string) => `lib-${label}-${run}`;

  async function user(label: string) {
    const created = await prisma.readerUser.create({ data: { email: `${label}-${run}@library.test`, emailVerifiedAt: new Date() } });
    userIds.push(created.id);
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: created.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    return { id: created.id, cookie: `${auth.READER_SESSION_COOKIE}=${token}` };
  }

  async function product(label: string, name: string, itemType: "SKILL" | "AGENT" | "PROMPT", published = true) {
    const created = await prisma.marketplaceProduct.create({
      data: {
        name, slug: slug(label), type: "Skill", itemType, outcome: "Fixture", description: "Fixture", creatorId, categoryId,
        version: "1.0.0", platforms: [], models: [], tags: [], benefits: [], installationSteps: [], previewFiles: [],
      },
    });
    productIds.push(created.id);
    if (published) {
      const snapshot = await prisma.marketplaceListingSnapshot.create({ data: { productId: created.id, revision: 1, schemaVersion: 0, digestSha256: "a".repeat(64), content: {}, createdByActor: "SYSTEM" } });
      await prisma.marketplaceProduct.update({ where: { id: created.id }, data: { approvedSnapshotId: snapshot.id, published: true, lifecycleState: "PUBLISHED" } });
    }
    return created.id;
  }

  const acquire = (userId: string, productId: string, daysAgo: number) => prisma.marketplaceOrder.create({
    data: { userId, productId, idempotencyKey: `${run}-${userId}-${productId}`, amountMinor: 0, currency: "USD", status: "completed", createdAt: new Date(Date.now() - daysAgo * 86_400_000) },
  });
  const library = (query = "", as = cookie) => request(app).get(`/api/marketplace/library${query}`).set("Cookie", as).set("Origin", origin);
  const names = (body: { data: { product: { name: string } }[] }) => body.data.map((entry) => entry.product.name);

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    ({ prisma } = await import("./lib/prisma.js"));
    auth = await import("./middleware/auth.js");
    app = (await import("./app.js")).createApp();

    const owner = await user("owner");
    ownerId = owner.id;
    const creator = await prisma.marketplaceCreator.create({ data: { name: "Library Seller", handle: `libseller-${run}`, initials: "LS", bio: "Fixture", ownerUserId: owner.id } });
    creatorId = creator.id;
    categoryId = (await prisma.marketplaceCategory.upsert({ where: { slug: "development" }, update: {}, create: { name: "Development", slug: "development" } })).id;

    const reader = await user("reader");
    cookie = reader.cookie;
    const bystander = await user("bystander");
    // Newest first would be: Zebra Skill, Mango Agent, 100% Prompt, Alpha Skill.
    const alpha = await product("alpha", "Alpha Skill", "SKILL");
    const prompt = await product("prompt", "100% Prompt", "PROMPT");
    const mango = await product("mango", "Mango Agent", "AGENT");
    const zebra = await product("zebra", "Zebra Skill", "SKILL");
    await product("hidden", "Unpublished Draft", "SKILL", false);
    await acquire(reader.id, alpha, 40);
    await acquire(reader.id, prompt, 30);
    await acquire(reader.id, mango, 20);
    await acquire(reader.id, zebra, 10);
    await acquire(bystander.id, alpha, 5);
  }, 60_000);

  afterAll(async () => {
    if (prisma) {
      try {
        await prisma.marketplaceOrder.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.marketplaceProduct.updateMany({ where: { id: { in: productIds } }, data: { approvedSnapshotId: null } });
        await prisma.marketplaceListingSnapshot.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.marketplaceProduct.deleteMany({ where: { id: { in: productIds } } });
        await prisma.marketplaceCreator.deleteMany({ where: { id: creatorId } });
        await prisma.readerUser.deleteMany({ where: { id: { in: userIds } } });
      } catch { /* a leftover fixture row never fails the suite */ }
      await prisma.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  describe("library", () => {
    it("lists the newest acquisition first by default and never another reader's", async () => {
      const response = await library();
      expect(response.status).toBe(200);
      expect(names(response.body)).toEqual(["Zebra Skill", "Mango Agent", "100% Prompt", "Alpha Skill"]);
      expect(response.body.meta).toMatchObject({ total: 4, totalPages: 1 });
    });

    it.each([
      ["oldest", ["Alpha Skill", "100% Prompt", "Mango Agent", "Zebra Skill"]],
      ["name", ["100% Prompt", "Alpha Skill", "Mango Agent", "Zebra Skill"]],
    ])("sorts by %s", async (sort, expected) => {
      expect(names((await library(`?sort=${sort}`)).body)).toEqual(expected);
    });

    it("filters by item type and counts only the matches", async () => {
      const skills = await library("?type=skill");
      expect(names(skills.body)).toEqual(["Zebra Skill", "Alpha Skill"]);
      expect(skills.body.meta).toMatchObject({ total: 2 });
      expect(skills.body.data[0].product.typeKey).toBe("skill");
      expect(names((await library("?type=agent")).body)).toEqual(["Mango Agent"]);
      expect((await library("?type=hook")).body.data).toEqual([]);
    });

    it("searches names case-insensitively and treats % as a plain character", async () => {
      expect(names((await library("?q=MANGO")).body)).toEqual(["Mango Agent"]);
      expect(names((await library("?q=skill")).body)).toEqual(["Zebra Skill", "Alpha Skill"]);
      expect(names((await library(`?q=${encodeURIComponent("100%")}`)).body)).toEqual(["100% Prompt"]);
      expect((await library(`?q=${encodeURIComponent("%")}`)).body.meta.total).toBe(1);
      expect((await library(`?q=${encodeURIComponent("_")}`)).body.meta.total).toBe(0);
      expect((await library("?q=nothing-matches-this")).body).toMatchObject({ data: [], meta: { total: 0, totalPages: 0 } });
    });

    it("combines filters with sorting and pagination", async () => {
      const first = await library("?type=skill&sort=name&limit=1&page=1");
      expect(names(first.body)).toEqual(["Alpha Skill"]);
      expect(first.body.meta).toMatchObject({ total: 2, totalPages: 2 });
      expect(names((await library("?type=skill&sort=name&limit=1&page=2")).body)).toEqual(["Zebra Skill"]);
    });

    it("rejects an unknown type or sort and an over-long search", async () => {
      expect((await library("?type=gadget")).status).toBe(400);
      expect((await library("?sort=random")).status).toBe(400);
      expect((await library(`?q=${"x".repeat(81)}`)).status).toBe(400);
    });

    it("requires a signed-in reader", async () => {
      expect((await request(app).get("/api/marketplace/library").set("Origin", origin)).status).toBe(401);
    });
  });

  describe("catalog lookup by slug", () => {
    const lookup = (slugs: string) => request(app).get(`/api/marketplace/products?slugs=${slugs}`).set("Origin", origin);

    it("returns only the published listings that were asked for", async () => {
      const response = await lookup([slug("alpha"), slug("zebra"), slug("hidden"), "no-such-listing"].join(","));
      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { slug: string }) => item.slug).sort()).toEqual([slug("alpha"), slug("zebra")].sort());
      expect(response.body.meta.total).toBe(2);
    });

    it("rejects an empty, malformed or oversized list", async () => {
      expect((await lookup("")).status).toBe(400);
      expect((await lookup("Not%20A%20Slug")).status).toBe(400);
      expect((await lookup(Array.from({ length: 49 }, (_, index) => `s-${index}`).join(","))).status).toBe(400);
    });

    it("leaves ordinary catalog browsing unchanged", async () => {
      const response = await request(app).get("/api/marketplace/products?limit=48").set("Origin", origin);
      expect(response.status).toBe(200);
      expect(response.body.data.some((item: { slug: string }) => item.slug === slug("alpha"))).toBe(true);
    });
  });
});
