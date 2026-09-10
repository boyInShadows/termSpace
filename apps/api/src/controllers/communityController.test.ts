import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
  marketplaceCreator: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceCategory: { findFirst: vi.fn(), findMany: vi.fn() },
  marketplaceProduct: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  $queryRaw: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

process.env.NODE_ENV = "test";
const { createApp } = await import("../app.js");
const { READER_SESSION_COOKIE } = await import("../middleware/auth.js");

/** A reader cookie long enough to pass the middleware's length guard. */
const READER_COOKIE = `${READER_SESSION_COOKIE}=${"a".repeat(48)}`;
const OWNER = { id: "user-1", email: "owner@example.com" };
const CREATOR = {
  id: "creator-1", name: "Ramtin K", handle: "ramtin", initials: "RK",
  verified: false, bio: "Building practical automation skills.", followers: 0,
  userId: OWNER.id,
};

const VALID_SUBMISSION = {
  name: "Changelog Writer",
  slug: "changelog-writer",
  type: "Skill",
  category: "Development",
  outcome: "Turn a messy commit range into a changelog people read.",
  description: "Reads a commit range and drafts release notes that lead with user-visible impact.",
  platforms: ["Claude"],
  models: ["Claude 4"],
};

function signedIn() {
  prismaMock.readerSession.findFirst.mockResolvedValue({ id: "session-1", user: OWNER });
}

describe("community publishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  });

  it("requires a reader session for every owned resource", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue(null);
    const app = createApp();
    for (const path of ["/api/community/creator", "/api/community/products"]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
  });

  it("rejects reserved usernames before touching the database", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);
    const response = await request(createApp())
      .post("/api/community/creator")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send({ name: "Someone Real", handle: "admin", bio: "A perfectly ordinary bio here." });
    expect(response.status).toBe(400);
    expect(prismaMock.marketplaceCreator.create).not.toHaveBeenCalled();
  });

  it("derives initials and binds the profile to the signed-in account", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceCreator.create.mockResolvedValue(CREATOR);
    const response = await request(createApp())
      .post("/api/community/creator")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send({ name: "Ramtin K", handle: "ramtin", bio: "Building practical automation skills." });
    expect(response.status).toBe(201);
    expect(prismaMock.marketplaceCreator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: OWNER.id, initials: "RK", verified: false }),
      }),
    );
  });

  it("never lets a submission set its own trust flags, price, or usage counts", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(CREATOR);
    prismaMock.marketplaceCategory.findFirst.mockResolvedValue({ id: "cat-1", name: "Development" });
    prismaMock.marketplaceProduct.create.mockImplementation(async ({ data }: any) => ({
      ...data, id: "product-1", category: { name: "Development", slug: "development" },
      rating: 0, reviewCount: 0, usageCount: 0, purchaseCount: 0, createdAt: new Date(), updatedAt: new Date(),
    }));

    const response = await request(createApp())
      .post("/api/community/products")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send({
        ...VALID_SUBMISSION,
        verified: true, featured: true, trending: true,
        priceMinor: 99_900, pricingModel: "one-time", rating: 5, usageCount: 50_000,
      });

    expect(response.status).toBe(201);
    const written = prismaMock.marketplaceProduct.create.mock.calls[0][0].data;
    expect(written).toMatchObject({
      verified: false, featured: false, trending: false,
      priceMinor: 0, pricingModel: "free", rating: 0, usageCount: 0,
      creatorId: CREATOR.id,
    });
  });

  it("refuses a category that does not exist", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(CREATOR);
    prismaMock.marketplaceCategory.findFirst.mockResolvedValue(null);
    const response = await request(createApp())
      .post("/api/community/products")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send({ ...VALID_SUBMISSION, category: "Nonexistent" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("UNKNOWN_CATEGORY");
    expect(prismaMock.marketplaceProduct.create).not.toHaveBeenCalled();
  });

  it("will not update a listing owned by a different member", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(CREATOR);
    // Scoped by creatorId, so somebody else's listing simply is not found.
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(null);
    const response = await request(createApp())
      .patch("/api/community/products/someone-elses-listing")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send({ name: "Hijacked" });
    expect(response.status).toBe(404);
    expect(prismaMock.marketplaceProduct.update).not.toHaveBeenCalled();
  });

  it("asks a member to create a profile before publishing", async () => {
    signedIn();
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);
    const response = await request(createApp())
      .post("/api/community/products")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", READER_COOKIE)
      .send(VALID_SUBMISSION);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NO_PROFILE");
  });
});
