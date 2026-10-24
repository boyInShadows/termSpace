import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ creator: vi.fn(), products: vi.fn(), count: vi.fn() }));
vi.mock("../lib/prisma.js", () => ({ prisma: { marketplaceCreator: { findFirst: db.creator }, marketplaceProduct: { findMany: db.products, count: db.count } } }));
import marketplaceRoutes from "../routes/marketplaceRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

const app = express();
app.use("/api/marketplace", marketplaceRoutes);
app.use(errorHandler);
const creator = { id: "creator-1", name: "Public Creator", handle: "public-creator", initials: "PC", bio: "Public creator biography", verified: true, followers: 0 };
const visible = { published: true, lifecycleState: { notIn: ["SUSPENDED", "ARCHIVED"] } };

describe("public creator profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.creator.mockResolvedValue(creator);
    db.count.mockResolvedValue(1);
    db.products.mockResolvedValue([{ id: "public-1", slug: "public-skill", name: "Public Skill", rating: 0, itemType: "SKILL", lifecycleState: "SUBMITTED", proposedSnapshotId: "private-draft-snapshot", approvedSnapshotId: "public-snapshot", category: { name: "Development" }, creator: { ...creator, _count: { products: 1 } }, compatibility: [] }]);
  });

  it("exposes an anonymous public profile with an allowlist of fields and public counts", async () => {
    const response = await request(app).get("/api/marketplace/creators/public-creator").expect(200);
    expect(response.body.data.creator).toEqual({ ...creator, products: 1 });
    expect(response.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
    expect(db.creator).toHaveBeenCalledWith({
      where: { handle: "public-creator", products: { some: visible } },
      select: { id: true, name: true, handle: true, initials: true, verified: true, bio: true, followers: true },
    });
    const query = db.products.mock.calls[0][0];
    expect(query.where).toEqual({ ...visible, creatorId: "creator-1" });
    expect(query.include.creator.select._count.select.products.where).toEqual(visible);
    expect(response.body.data.products[0].creator.products).toBe(1);
    expect(response.body.data.products[0]).not.toHaveProperty("proposedSnapshotId");
    expect(response.body.data.products[0]).not.toHaveProperty("lifecycleState");
    expect(JSON.stringify(response.body)).not.toContain("private-draft-snapshot");
    expect(db.count).toHaveBeenCalledWith({ where: { ...visible, creatorId: "creator-1" } });
  });

  it("ignores caller-supplied creator and visibility overrides and bounds pagination", async () => {
    await request(app).get("/api/marketplace/creators/public-creator?page=2&limit=3&creatorId=other&published=false").expect(200);
    expect(db.products).toHaveBeenCalledWith(expect.objectContaining({ where: { ...visible, creatorId: "creator-1" }, skip: 3, take: 3 }));
  });

  it("returns the same 404 for missing creators and creators with only private listings", async () => {
    db.creator.mockResolvedValue(null);
    const response = await request(app).get("/api/marketplace/creators/private-creator").expect(404);
    expect(response.body.error.code).toBe("CREATOR_NOT_FOUND");
    expect(db.creator.mock.calls[0][0].where.products.some).toEqual(visible);
    expect(db.products).not.toHaveBeenCalled();
    expect(db.count).not.toHaveBeenCalled();
  });

  it.each(["bad--handle", "a", "a".repeat(41)])("validates handle %s before querying", async (handle) => {
    await request(app).get(`/api/marketplace/creators/${handle}`).expect(400);
    expect(db.creator).not.toHaveBeenCalled();
  });

  it.each(["page=0", "page=NaN", "page=2147483648", "limit=49", "limit=0"])("rejects invalid pagination %s", async (query) => {
    await request(app).get(`/api/marketplace/creators/public-creator?${query}`).expect(400);
    expect(db.creator).not.toHaveBeenCalled();
  });
});
