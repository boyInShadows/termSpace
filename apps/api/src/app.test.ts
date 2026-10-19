import { hash } from "bcryptjs";
import request from "supertest";
import { ipKeyGenerator } from "express-rate-limit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyGoogleIdToken = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  adminSession: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  article: { findUnique: vi.fn(), updateMany: vi.fn() },
  readerUser: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  readerSession: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  readerEmailVerification: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  readerPasswordReset: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  transactionalEmailOutbox: { updateMany: vi.fn() },
  marketplaceProduct: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceProductVersion: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceReleaseManifest: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  marketplaceProviderConnection: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  marketplaceSourceCheckJob: { findFirst: vi.fn(), create: vi.fn() },
  marketplaceSkillReleaseDetails: { create: vi.fn() },
  marketplaceListingSnapshot: { aggregate: vi.fn(), create: vi.fn() },
  marketplaceManifestSnapshot: { create: vi.fn() },
  marketplaceCommunity: { findMany: vi.fn(), findUnique: vi.fn() },
  marketplaceCommunityPlacementRequest: { createMany: vi.fn() },
  marketplaceCommunityPlacement: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceCommunityPlacementEvent: { create: vi.fn() },
  marketplaceListingLifecycleEvent: { create: vi.fn(), findMany: vi.fn() },
  marketplaceReview: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), aggregate: vi.fn() },
  marketplaceOrder: { count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  marketplaceCreator: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceRoleGrant: { findUnique: vi.fn(), create: vi.fn() },
  marketplaceRoleEvent: { create: vi.fn() },
  marketplaceCategory: { findMany: vi.fn(), findUnique: vi.fn() },
  marketplacePlatform: { findMany: vi.fn() },
  $transaction: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock("./lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyGoogleIdToken;
  },
}));

process.env.NODE_ENV = "test";
process.env.LOCAL_AUTO_VERIFY_EMAIL = "false";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
const { createApp } = await import("./app.js");
const { authRateLimiters } = await import("./middleware/security.js");
const { createEmailVerificationToken, createPasswordResetCode } = await import("./lib/emailVerification.js");

function marketplaceManifestFixture() {
  return {
    manifestVersion: 1,
    type: "skill",
    listing: {
      slug: "owned-skill",
      name: { en: "Owned Skill" },
      outcome: { en: "Completes a useful task" },
      description: { en: "A complete marketplace test item." },
      categorySlug: "developer-tools",
      communitySlugs: ["codex"],
      tags: ["testing"],
      screenshots: [],
    },
    release: {
      version: "1.0.0",
      source: { kind: "github_repository", repositoryUrl: "https://github.com/example/item", commitSha: "a".repeat(40) },
      releaseNotes: "Initial release",
      compatibility: [{ platform: "codex", models: [] }],
      installation: { method: "manual", instructions: ["Copy the files"] },
      requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [], environmentVariables: [] },
      permissions: [],
      license: { identifier: "MIT" },
    },
    typeDetails: { format: "SKILL.md", entryPath: "SKILL.md", activation: "Install in the skills directory", bundledExecutables: false, inputs: [], outputs: [] },
  };
}

describe("API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const limiter of authRateLimiters) {
      limiter.resetKey(ipKeyGenerator("::ffff:127.0.0.1"));
      limiter.resetKey(ipKeyGenerator("127.0.0.1"));
    }
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    prismaMock.article.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.marketplacePlatform.findMany.mockResolvedValue([]);
  });

  it("serves health with hardened headers", async () => {
    const response = await request(createApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("reports database outages through health", async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("database offline"));
    const response = await request(createApp()).get("/api/health");
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("does not expose the retired community publishing API", async () => {
    const response = await request(createApp()).post("/api/community/products").send({});

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("serves marketplace home data from the shared API", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(12);
    prismaMock.marketplaceCreator.findMany.mockResolvedValue([]);
    prismaMock.marketplaceCategory.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.groupBy.mockResolvedValue([{ itemType: "SKILL", _count: { _all: 7 } }, { itemType: null, _count: { _all: 2 } }]);
    const response = await request(createApp()).get("/api/marketplace/home");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ products: [], creators: [], categories: [], types: [{ type: "skill", products: 7 }], platforms: [], total: 12 });
  });

  it("publishes the controlled marketplace item-type registry", async () => {
    const response = await request(createApp()).get("/api/marketplace/item-types");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(9);
    expect(response.body.data).toContainEqual(expect.objectContaining({ key: "mcp_server", en: "MCP server" }));
  });

  it("adds stable type keys without leaking classification state", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([{
      id: "product-1", slug: "example-skill", name: "Example Skill", type: "Skill", itemType: "SKILL",
      classificationRequired: false, rating: 4.5, priceMinor: 0, currency: "USD", pricingModel: "free",
      platforms: ["Codex"], models: [], categoryId: "category-1", category: { name: "Developer tools" },
      creatorId: "creator-1", creator: null,
    }]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(1);
    prismaMock.marketplaceCreator.findMany.mockResolvedValue([]);
    prismaMock.marketplaceCategory.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.groupBy.mockResolvedValue([]);

    const response = await request(createApp()).get("/api/marketplace/home");
    expect(response.status).toBe(200);
    expect(response.body.data.products[0]).toEqual(expect.objectContaining({ type: "Skill", typeKey: "skill" }));
    expect(response.body.data.products[0]).not.toHaveProperty("itemType");
    expect(response.body.data.products[0]).not.toHaveProperty("classificationRequired");
    expect(response.body.data.products[0]).not.toHaveProperty("lifecycleState");
    expect(response.body.data.products[0]).not.toHaveProperty("approvedSnapshotId");
  });

  it("keeps the declared permissions summary, licence and review state on catalogue list items", async () => {
    // The listing card shows these; they are product columns, so the list query must not narrow them away.
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([{
      id: "product-1", slug: "example-skill", name: "Example Skill", type: "Skill", itemType: "SKILL",
      classificationRequired: false, rating: 4.5, priceMinor: 0, currency: "USD", pricingModel: "free",
      platforms: ["Codex"], models: [], categoryId: "category-1", category: { name: "Developer tools" },
      creatorId: "creator-1", creator: null, verified: true,
      permissions: "Reads the current selection · no network access", license: "MIT",
    }]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(1);

    const response = await request(createApp()).get("/api/marketplace/products");

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      verified: true, permissions: "Reads the current selection · no network access", license: "MIT",
    }));
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.not.objectContaining({ select: expect.anything() }));
  });

  it("filters only by canonical item-type keys", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);

    expect((await request(createApp()).get("/api/marketplace/products?type=prompt")).status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ itemType: "PROMPT" }),
    }));

    expect((await request(createApp()).get("/api/marketplace/products?type=Prompt%20pack")).status).toBe(400);
  });

  it("combines approved community placement and platform compatibility filters", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);

    const response = await request(createApp()).get("/api/marketplace/products?community=codex&platform=codex");

    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        published: true,
        compatibility: { some: { platformKey: "codex" } },
        communityPlacements: { some: { state: "APPROVED", community: { slug: "codex", state: "ACTIVE" } } },
      }),
    }));
  });

  it("searches public listing, creator, category, community, and compatibility metadata", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);

    const response = await request(createApp()).get("/api/marketplace/products?q=codex%20review&sort=rating&page=2&limit=10");

    expect(response.status).toBe(200);
    const call = prismaMock.marketplaceProduct.findMany.mock.calls.at(-1)?.[0];
    expect(call).toMatchObject({
      skip: 10,
      take: 10,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }],
      where: { published: true },
    });
    expect(call.where.AND).toHaveLength(2);
    expect(call.where.AND[0].OR).toEqual(expect.arrayContaining([
      { tags: { has: "codex" } },
      { creator: { OR: expect.any(Array) } },
      { category: { OR: expect.any(Array) } },
      { compatibility: { some: { OR: expect.any(Array) } } },
      { communityPlacements: { some: expect.objectContaining({ state: "APPROVED", community: expect.objectContaining({ state: "ACTIVE" }) }) } },
    ]));
  });

  it("filters declared access on the approved public release rather than drafts or old versions", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);
    const response = await request(createApp()).get("/api/marketplace/products?permission=network_access");
    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        published: true,
        approvedSnapshot: { releaseManifest: { permissions: { some: { capability: "NETWORK_ACCESS" } } } },
      }),
    }));
    expect((await request(createApp()).get("/api/marketplace/products?permission=unknown")).status).toBe(400);
  });

  it("treats SQL wildcard and escape characters as literal search text", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);
    await request(createApp()).get("/api/marketplace/products").query({ q: "a_%\\b" });
    const branches = prismaMock.marketplaceProduct.findMany.mock.calls.at(-1)?.[0].where.AND[0].OR;
    expect(branches).toContainEqual({ name: { contains: "a\\_\\%\\\\b", mode: "insensitive" } });
    expect(branches).toContainEqual({ models: { has: "a_%\\b" } });
    expect(branches).toContainEqual({ creator: { OR: expect.arrayContaining([{ handle: { contains: "a\\_\\%\\\\b", mode: "insensitive" } }]) } });
  });

  it.each([
    ["featured", [{ featured: "desc" }, { usageCount: "desc" }, { id: "asc" }]],
    ["newest", [{ updatedAt: "desc" }, { id: "asc" }]],
  ])("uses deterministic %s pagination ordering", async (sort, orderBy) => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);

    expect((await request(createApp()).get(`/api/marketplace/products?sort=${sort}`)).status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ orderBy }));
  });

  describe("relevance search", () => {
    const row = (id: string) => ({
      id, slug: id, name: id, type: "Skill", itemType: "SKILL", rating: 0, priceMinor: 0, currency: "USD", pricingModel: "free",
      platforms: [], models: [], category: { name: "Developer tools", slug: "developer-tools" }, creator: { id: "c", name: "C", handle: "c", initials: "C", verified: true, bio: "", followers: 0, _count: { products: 1 } },
    });

    it("matches once over ids, ranks in SQL, and returns the page in ranked order with the true total", async () => {
      prismaMock.marketplaceProduct.findMany
        .mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }])
        .mockResolvedValueOnce([row("c"), row("a")]);
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "c" }, { id: "a" }]);

      const response = await request(createApp()).get("/api/marketplace/products?q=Pull%20Request&sort=relevance&limit=2");

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual(["c", "a"]);
      expect(response.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
      expect(prismaMock.marketplaceProduct.count).not.toHaveBeenCalled();
      expect(prismaMock.marketplaceProduct.findMany.mock.calls[0][0]).toMatchObject({ select: { id: true } });
      expect(prismaMock.marketplaceProduct.findMany.mock.calls[1][0].where).toEqual({ id: { in: ["c", "a"] } });
      // Prisma.sql keeps the bound values apart from the SQL text: ids, lowered terms, offset, limit.
      const [ids, terms, offset, limit] = prismaMock.$queryRaw.mock.calls[0][0].values;
      expect([ids, terms, offset, limit]).toEqual([["a", "b", "c"], ["pull", "request"], 0, 2]);
    });

    it("pages through the ranking with an offset, never re-sorting in the app", async () => {
      prismaMock.marketplaceProduct.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }]).mockResolvedValueOnce([row("c")]);
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "c" }]);

      await request(createApp()).get("/api/marketplace/products?q=x&sort=relevance&limit=2&page=2");

      expect(prismaMock.$queryRaw.mock.calls[0][0].values.slice(2)).toEqual([2, 2]);
    });

    it("skips ranking and the second query when nothing matches", async () => {
      prismaMock.marketplaceProduct.findMany.mockResolvedValueOnce([]);

      const response = await request(createApp()).get("/api/marketplace/products?q=zzz&sort=relevance");

      expect(response.body).toMatchObject({ data: [], meta: { total: 0, totalPages: 0 } });
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
      expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledTimes(1);
    });

    it("falls back to featured ordering when there is no search text", async () => {
      prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
      prismaMock.marketplaceProduct.count.mockResolvedValue(0);

      expect((await request(createApp()).get("/api/marketplace/products?sort=relevance")).status).toBe(200);

      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
      expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
        orderBy: [{ featured: "desc" }, { usageCount: "desc" }, { id: "asc" }],
      }));
    });

    it("leaves an explicit sort alone even when searching", async () => {
      prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
      prismaMock.marketplaceProduct.count.mockResolvedValue(0);

      await request(createApp()).get("/api/marketplace/products?q=review&sort=rating");

      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
      expect(prismaMock.marketplaceProduct.count).toHaveBeenCalled();
    });
  });

  it("lists active communities with approved published placement counts", async () => {
    prismaMock.marketplaceCommunity.findMany.mockResolvedValue([{
      slug: "codex", nameEn: "Codex", nameFa: "کودکس", descriptionEn: "Codex tools", descriptionFa: null,
      primaryPlatform: "codex", rulesEn: "Be relevant.", rulesFa: null,
      submissionGuidanceEn: "Explain compatibility.", submissionGuidanceFa: null, state: "ACTIVE", _count: { placements: 4 },
    }]);

    const response = await request(createApp()).get("/api/marketplace/communities");

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ slug: "codex", state: "active", products: 4 });
    expect(prismaMock.marketplaceCommunity.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { state: "ACTIVE" },
      select: expect.objectContaining({ _count: { select: { placements: { where: { state: "APPROVED", product: { published: true } } } } } }),
    }));
  });

  it("returns an explicit archived community state without public placements", async () => {
    prismaMock.marketplaceCommunity.findUnique.mockResolvedValue({
      slug: "legacy", nameEn: "Legacy", nameFa: null, descriptionEn: "Archived tools", descriptionFa: null,
      primaryPlatform: "legacy", rulesEn: "No new submissions.", rulesFa: null,
      submissionGuidanceEn: "Archived.", submissionGuidanceFa: null, state: "ARCHIVED",
    });

    const response = await request(createApp()).get("/api/marketplace/communities/legacy");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ community: { slug: "legacy", state: "archived" }, products: [] });
    expect(response.body.meta.total).toBe(0);
    expect(prismaMock.marketplaceProduct.findMany).not.toHaveBeenCalled();
  });

  it("does not expose draft-only versions on a public product page", async () => {
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({
      id: "product-1", slug: "published-skill", name: "Published Skill", type: "Skill", itemType: "SKILL",
      rating: 0, priceMinor: 0, currency: "USD", pricingModel: "free", platforms: ["Codex"], models: [],
      categoryId: "category-1", category: { name: "Developer tools", slug: "developer-tools" },
      creatorId: "creator-1", creator: { id: "creator-1", name: "Creator", handle: "creator", initials: "CR", verified: true, bio: "Creator biography", followers: 0, _count: { products: 1 } },
      installationSteps: ["private installation step"],
      versions: [], reviews: [],
    });
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);

    const response = await request(createApp()).get("/api/marketplace/products/published-skill");

    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceProduct.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        versions: {
          where: { releaseManifests: { some: { publishedAt: { not: null } } } },
          orderBy: { releasedAt: "desc" },
        },
      }),
    }));
    expect(response.body.data).not.toHaveProperty("installationSteps");
    expect(JSON.stringify(response.body)).not.toContain("private installation step");
  });

  describe("public release on a product page", () => {
    const productRow = {
      id: "product-1", slug: "published-skill", name: "Published Skill", type: "Skill", itemType: "SKILL",
      rating: 0, priceMinor: 0, currency: "USD", pricingModel: "free", platforms: ["Codex"], models: [],
      categoryId: "category-1", category: { name: "Developer tools", slug: "developer-tools" },
      creatorId: "creator-1", creator: { id: "creator-1", name: "Creator", handle: "creator", initials: "CR", verified: true, bio: "Creator biography", followers: 0, _count: { products: 1 } },
      versions: [], reviews: [],
    };
    const releaseRow = {
      sourceKind: "NPM", sourceUrl: "https://registry.npmjs.org/@acme/tool", sourceRef: "1.2.3", sourcePath: null,
      providerIntegrityDigest: "sha512-abc", artifactSizeBytes: 2048, sourceCheckStatus: "VERIFIED", sourceCheckedAt: new Date("2026-10-01T00:00:00Z"),
      resolvedInstallationUrl: "https://registry.npmjs.org/@acme/tool/-/tool-1.2.3.tgz", installationMethod: "NPM",
      licenseIdentifier: "MIT", customLicenseUrl: null, installationInstructions: ["private installation step"],
      productVersion: { version: "1.2.3" },
      permissions: [{ capability: "NETWORK_ACCESS", required: true, scope: null, destinations: ["api.acme.test"], purpose: "Calls the Acme API" }],
      environmentVariables: [{ name: "ACME_TOKEN", purpose: "Auth", required: true, sensitive: true }],
      mcpServerDetails: { transport: "stdio" },
    };

    it("shows the pinned source, declarations and fetch target, but not the creator's steps", async () => {
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(productRow);
      prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(releaseRow);

      const response = await request(createApp()).get("/api/marketplace/products/published-skill");

      expect(response.status).toBe(200);
      expect(prismaMock.marketplaceReleaseManifest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { productVersion: { productId: "product-1" }, publishedAt: { not: null }, sourceCheckStatus: { in: ["VERIFIED", "STALE"] } },
      }));
      expect(response.body.data.release).toMatchObject({
        version: "1.2.3",
        source: { kind: "npm", url: "https://registry.npmjs.org/@acme/tool", ref: "1.2.3", status: "verified", integrityDigest: "sha512-abc" },
        installation: { method: "npm", url: "https://registry.npmjs.org/@acme/tool/-/tool-1.2.3.tgz" },
        permissions: [{ capability: "network_access", destinations: ["api.acme.test"] }],
        environment: [{ name: "ACME_TOKEN", sensitive: true }],
        license: "MIT",
        mcp: { transport: "stdio" },
      });
      expect(JSON.stringify(response.body)).not.toContain("private installation step");
    });

    it("withholds a release whose installation URL is not on a trusted host", async () => {
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(productRow);
      prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue({ ...releaseRow, resolvedInstallationUrl: "https://evil.example/tool.tgz" });

      const response = await request(createApp()).get("/api/marketplace/products/published-skill");

      expect(response.status).toBe(200);
      expect(response.body.data.release).toBeNull();
    });
  });

  it("does not expose an unpublished listing through the public product route", async () => {
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(null);

    const response = await request(createApp()).get("/api/marketplace/products/private-skill");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(prismaMock.marketplaceProduct.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: "private-skill", published: true },
    }));
  });

  it("rejects invalid newsletter input before database access", async () => {
    const response = await request(createApp())
      .post("/api/newsletter/subscribers")
      .send({ email: "not-an-email" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects oversized JSON payloads with 413", async () => {
    const response = await request(createApp())
      .post("/api/newsletter/subscribers")
      .send({ email: `${"a".repeat(110_000)}@example.com` });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns a stable error for malformed JSON without parser details", async () => {
    const response = await request(createApp())
      .post("/api/newsletter/subscribers")
      .set("Content-Type", "application/json")
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.objectContaining({
      code: "INVALID_JSON",
      message: "Request body must contain valid JSON",
      correlationId: expect.any(String),
    }));
    expect(JSON.stringify(response.body)).not.toContain("SyntaxError");
  });

  it("preserves a valid incoming correlation ID on error responses", async () => {
    const correlationId = "browser-check-12345678";
    const response = await request(createApp())
      .get("/api/route-that-does-not-exist")
      .set("X-Correlation-ID", correlationId);
    expect(response.status).toBe(404);
    expect(response.headers["x-correlation-id"]).toBe(correlationId);
    expect(response.body.error).toEqual({
      code: "ROUTE_NOT_FOUND",
      message: "Route not found",
      correlationId,
    });
  });

  it("replaces unsafe correlation IDs and rejects invalid path parameters", async () => {
    const response = await request(createApp())
      .get("/api/marketplace/products/invalid!slug")
      .set("X-Correlation-ID", "unsafe value with spaces");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details[0]).toEqual(expect.objectContaining({ path: "slug" }));
    expect(response.body.error.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(prismaMock.marketplaceProduct.findFirst).not.toHaveBeenCalled();
  });

  it("creates an HttpOnly session for valid credentials", async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      passwordHash: await hash("correct-password", 4),
    });

    const response = await request(createApp())
      .post("/api/admin/login")
      .send({ email: "admin@example.com", password: "correct-password" });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Lax");
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("rejects invalid admin credentials", async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue(null);
    const response = await request(createApp())
      .post("/api/admin/login")
      .send({ email: "admin@example.com", password: "wrong-password" });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("registers a password account with an atomic verification outbox record", async () => {
    prismaMock.readerUser.create.mockResolvedValue({
      id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [],
    });

    const response = await request(createApp())
      .post("/api/readers/register")
      .send({ email: "reader@example.com", password: "correct-password" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.emailVerified).toBe(false);
    expect(prismaMock.readerUser.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: "reader@example.com",
        emailVerifications: { create: expect.objectContaining({ expiresAt: expect.any(Date), outbox: { create: { correlationId: expect.any(String) } } }) },
      }),
    }));
  });

  it("auto-verifies local registrations without creating an email job when explicitly enabled", async () => {
    const previousBypass = process.env.LOCAL_AUTO_VERIFY_EMAIL;
    const previousUrl = process.env.WEB_PUBLIC_URL;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = "http://localhost:3100";
    prismaMock.readerUser.create.mockResolvedValue({
      id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [],
    });

    try {
      const response = await request(createApp())
        .post("/api/readers/register")
        .send({ email: "reader@example.com", password: "correct-password" });

      expect(response.status).toBe(200);
      expect(response.body.data.user.emailVerified).toBe(true);
      const createData = prismaMock.readerUser.create.mock.calls[0][0].data;
      expect(createData.emailVerifiedAt).toBeInstanceOf(Date);
      expect(createData.emailVerifications).toBeUndefined();
    } finally {
      process.env.LOCAL_AUTO_VERIFY_EMAIL = previousBypass;
      process.env.WEB_PUBLIC_URL = previousUrl;
    }
  });

  it("auto-verifies an existing local password account on successful login", async () => {
    const previousBypass = process.env.LOCAL_AUTO_VERIFY_EMAIL;
    const previousUrl = process.env.WEB_PUBLIC_URL;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = "http://127.0.0.1:3100";
    prismaMock.readerUser.findUnique.mockResolvedValue({
      id: "reader-1", email: "reader@example.com", passwordHash: await hash("correct-password", 4),
      emailVerifiedAt: null, marketplaceRoleGrants: [],
    });
    prismaMock.readerUser.update.mockResolvedValue({
      id: "reader-1", email: "reader@example.com", passwordHash: await hash("correct-password", 4),
      emailVerifiedAt: new Date(), marketplaceRoleGrants: [],
    });

    try {
      const response = await request(createApp())
        .post("/api/readers/login")
        .send({ email: "reader@example.com", password: "correct-password" });

      expect(response.status).toBe(200);
      expect(response.body.data.user.emailVerified).toBe(true);
      expect(prismaMock.readerUser.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "reader-1" },
        data: { emailVerifiedAt: expect.any(Date) },
      }));
    } finally {
      process.env.LOCAL_AUTO_VERIFY_EMAIL = previousBypass;
      process.env.WEB_PUBLIC_URL = previousUrl;
    }
  });

  it("rejects cookie-authenticated mutations without browser provenance", async () => {
    const response = await request(createApp())
      .put("/api/readers/profile/password")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ currentPassword: "old-password", newPassword: "new-password" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_ORIGIN_REJECTED");
  });

  it("does not expose article preview tokens on public detail responses", async () => {
    prismaMock.article.findUnique.mockResolvedValue({
      id: "article-1",
      title: "Published article",
      slug: "published-article",
      excerpt: null,
      content: "Published article content",
      heroImage: null,
      published: true,
      publishedAt: new Date("2026-08-27T00:00:00.000Z"),
      createdAt: new Date("2026-08-27T00:00:00.000Z"),
      updatedAt: new Date("2026-08-27T00:00:00.000Z"),
      scheduledAt: null,
      previewToken: "private-preview-token",
      seriesOrder: null,
      author: { id: "author-1", name: "Author", bio: null, avatarUrl: null },
      category: { id: "category-1", name: "Category", slug: "category" },
      series: null,
      tags: [],
    });

    const response = await request(createApp()).get("/api/articles/published-article");

    expect(response.status).toBe(200);
    expect(response.body.data.previewToken).toBeUndefined();
  });

  it("requires an administrator session for article previews", async () => {
    const response = await request(createApp()).get("/api/articles/preview/private-preview-token");
    expect(response.status).toBe(401);
    expect(prismaMock.article.findUnique).not.toHaveBeenCalled();
  });

  it("does not treat a marketplace administrator as a Blog administrator", async () => {
    prismaMock.adminSession.findFirst.mockResolvedValue(null);
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: "reader-1",
        email: "marketplace-admin@example.com",
        emailVerifiedAt: new Date("2026-09-15T00:00:00.000Z"),
        marketplaceRoleGrants: [{ role: "ADMINISTRATOR" }],
      },
    });

    const response = await request(createApp())
      .get("/api/articles/preview/private-preview-token")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(401);
    expect(prismaMock.adminSession.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.readerSession.findFirst).not.toHaveBeenCalled();
  });

  it("does not treat a Blog administrator as a marketplace moderator", async () => {
    prismaMock.adminSession.findFirst.mockResolvedValue({
      id: "admin-session-1",
      user: { id: "admin-1", email: "blog-admin@example.com" },
    });

    const response = await request(createApp())
      .get("/api/marketplace/moderation/queue")
      .set("Cookie", "term_academy_session=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(prismaMock.adminSession.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.readerSession.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceProduct.findMany).not.toHaveBeenCalled();
  });

  it("returns verified-email state and active marketplace roles in the reader session", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: "reader-1",
        email: "creator@example.com",
        emailVerifiedAt: new Date("2026-09-15T00:00:00.000Z"),
        marketplaceRoleGrants: [{ role: "CREATOR" }],
      },
    });

    const response = await request(createApp())
      .get("/api/readers/session")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({
      id: "reader-1",
      email: "creator@example.com",
      emailVerified: true,
      marketplaceRoles: ["creator"],
    });
  });

  it("answers an anonymous session check with 200 and authenticated false, not 401", async () => {
    const withoutCookie = await request(createApp()).get("/api/readers/session");
    expect(withoutCookie.status).toBe(200);
    expect(withoutCookie.body).toEqual({ data: { authenticated: false } });

    prismaMock.readerSession.findFirst.mockResolvedValue(null);
    const expired = await request(createApp())
      .get("/api/readers/session")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");
    expect(expired.status).toBe(200);
    expect(expired.body.data.authenticated).toBe(false);

    // Protected reader routes still refuse an anonymous caller.
    expect((await request(createApp()).get("/api/readers/profile")).status).toBe(401);
  });

  it("rejects creator onboarding until the reader email is verified", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });

    const response = await request(createApp())
      .post("/api/marketplace/creator/profile")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ name: "Reader Creator", handle: "reader-creator", bio: "I build dependable tools for agentic coding workflows." });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    expect(prismaMock.marketplaceCreator.create).not.toHaveBeenCalled();
  });

  it("creates an owned creator profile and audited creator role atomically", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceRoleGrant.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceCreator.create.mockResolvedValue({
      id: "creator-1", name: "Reader Creator", handle: "reader-creator", initials: "RC", verified: false,
      bio: "I build dependable tools for agentic coding workflows.", followers: 0,
      createdAt: new Date("2026-09-15T00:00:00.000Z"), updatedAt: new Date("2026-09-15T00:00:00.000Z"), _count: { products: 0 },
    });
    prismaMock.marketplaceRoleGrant.create.mockResolvedValue({});
    prismaMock.marketplaceRoleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/profile")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ name: "Reader Creator", handle: "reader-creator", bio: "I build dependable tools for agentic coding workflows." });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ id: "creator-1", handle: "reader-creator", initials: "RC", products: 0 });
    expect(prismaMock.marketplaceCreator.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ownerUserId: "reader-1" }) }));
    expect(prismaMock.marketplaceRoleGrant.create).toHaveBeenCalledWith({ data: { userId: "reader-1", role: "CREATOR" } });
    expect(prismaMock.marketplaceRoleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ subjectUserId: "reader-1", action: "GRANTED", reason: "Self-service creator onboarding" }) });
  });

  it("does not let a revoked creator self-restore access", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceRoleGrant.findUnique.mockResolvedValue({ revokedAt: new Date() });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/profile")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ name: "Reader Creator", handle: "reader-creator", bio: "I build dependable tools for agentic coding workflows." });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CREATOR_ACCESS_REVOKED");
    expect(prismaMock.marketplaceCreator.create).not.toHaveBeenCalled();
  });

  it("scopes creator profile updates to the authenticated owner", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .patch("/api/marketplace/creator/profile")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ name: "Updated Creator", bio: "An updated biography long enough for profile validation." });

    expect(response.status).toBe(404);
    expect(prismaMock.marketplaceCreator.findUnique).toHaveBeenCalledWith({ where: { ownerUserId: "reader-1" }, select: { id: true } });
    expect(prismaMock.marketplaceCreator.update).not.toHaveBeenCalled();
  });

  it("submits only an owned proposal whose exact release source was verified", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: false, lifecycleState: "DRAFT", lifecycleVersion: 2,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-2",
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } },
      approvedSnapshot: null,
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.marketplaceProduct.update.mockResolvedValue({
      id: "product-1", slug: "owned-skill", lifecycleState: "SUBMITTED", lifecycleVersion: 3,
      published: false, approvedSnapshotId: null, proposedSnapshotId: "snapshot-2",
    });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "SUBMIT", expectedVersion: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: "product-1", state: "submitted", version: 3, published: false });
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      productId: "product-1", snapshotId: "snapshot-2", previousState: "DRAFT", resultingState: "SUBMITTED",
      action: "SUBMITTED", actorType: "CREATOR", actorUserId: "reader-1",
    }) });
  });

  it("freezes the exact release manifest in the publication transaction", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: false, lifecycleState: "APPROVED", lifecycleVersion: 4,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-1",
      proposedSnapshot: {
        content: marketplaceManifestFixture(), schemaVersion: 1,
        releaseManifest: { id: "release-1", publishedAt: null, sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" },
      },
      approvedSnapshot: null,
      lifecycleEvents: [],
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.marketplaceCategory.findUnique.mockResolvedValue({ id: "category-1" });
    prismaMock.marketplaceReleaseManifest.update.mockResolvedValue({});
    prismaMock.marketplaceProduct.update.mockResolvedValue({
      id: "product-1", slug: "owned-skill", lifecycleState: "PUBLISHED", lifecycleVersion: 5,
      published: true, approvedSnapshotId: "snapshot-1", proposedSnapshotId: null,
    });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "PUBLISH", expectedVersion: 4, internalNote: "Source and declared permissions reviewed." });

    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceReleaseManifest.update).toHaveBeenCalledWith({
      where: { id: "release-1" },
      data: { publishedAt: expect.any(Date) },
    });
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      snapshotId: "snapshot-1", action: "PUBLISHED", internalNote: "Source and declared permissions reviewed.",
    }) });
  });

  it.each([
    { action: "ARCHIVE", state: "PUBLISHED", next: "ARCHIVED", visible: false },
    { action: "RESTORE", state: "ARCHIVED", next: "PUBLISHED", visible: true },
    { action: "RESTORE", state: "ARCHIVED", next: "SUBMITTED", visible: false, resume: "SUBMITTED", resumePublished: false },
    { action: "RESTORE", state: "ARCHIVED", code: "SOURCE_VERIFICATION_REQUIRED", verified: false },
    { action: "RESTORE", state: "ARCHIVED", code: "INVALID_LISTING_TRANSITION", actor: "MODERATOR" },
    { action: "RESTORE", state: "ARCHIVED", code: "LISTING_VERSION_CONFLICT", version: 3 },
    { action: "RESTORE", state: "ARCHIVED", code: "RESUME_STATE_REQUIRED", resume: null, resumePublished: false },
    { action: "ARCHIVE", state: "SUSPENDED", code: "INVALID_LISTING_TRANSITION" },
    { action: "ARCHIVE", state: "PUBLISHED", code: "LISTING_NOT_FOUND", owner: "other-reader" },
  ])("enforces creator $action for $state ($code)", async (scenario) => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1", user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    const product = {
      id: "product-1", slug: "owned-skill", published: scenario.state === "PUBLISHED", lifecycleState: scenario.state, lifecycleVersion: 4,
      lifecycleResumeState: scenario.resume === undefined ? "PUBLISHED" : scenario.resume, lifecycleResumePublished: scenario.resumePublished ?? true,
      approvedSnapshotId: "approved-1", proposedSnapshotId: "proposed-1", proposedSnapshot: null,
      approvedSnapshot: { schemaVersion: 1, releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: scenario.verified === false ? "FAILED" : "VERIFIED" } },
      lifecycleEvents: [{ actorType: scenario.actor ?? "CREATOR" }], creator: { ownerUserId: scenario.owner ?? "reader-1" },
    };
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue(product);
    prismaMock.marketplaceProduct.update.mockResolvedValue({ ...product, lifecycleState: scenario.next, lifecycleVersion: 5, published: scenario.visible });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);
    const response = await request(createApp()).post("/api/marketplace/creator/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000").set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: scenario.action, expectedVersion: scenario.version ?? 4 });
    if (scenario.code) {
      expect(response.status).toBe(scenario.code === "LISTING_NOT_FOUND" ? 404 : 409);
      expect(response.body.error.code).toBe(scenario.code);
      expect(prismaMock.marketplaceProduct.update).not.toHaveBeenCalled();
      expect(prismaMock.marketplaceListingLifecycleEvent.create).not.toHaveBeenCalled();
    } else {
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ state: scenario.next!.toLowerCase(), version: 5, published: scenario.visible, approvedSnapshotId: "approved-1", proposedSnapshotId: "proposed-1" });
      expect(prismaMock.marketplaceProduct.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lifecycleState: scenario.next, published: scenario.visible, approvedSnapshotId: "approved-1", proposedSnapshotId: "proposed-1" }) }));
    }
  });

  it("restores a creator-archived legacy publication without inventing modern source verification", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "legacy-skill", published: false, lifecycleState: "ARCHIVED", lifecycleVersion: 2,
      lifecycleResumeState: "PUBLISHED", lifecycleResumePublished: true, approvedSnapshotId: "legacy-snapshot", proposedSnapshotId: null,
      proposedSnapshot: null,
      approvedSnapshot: { schemaVersion: 0, releaseManifest: null },
      lifecycleEvents: [{ actorType: "CREATOR" }],
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.marketplaceProduct.update.mockResolvedValue({
      id: "product-1", slug: "legacy-skill", lifecycleState: "PUBLISHED", lifecycleVersion: 3,
      published: true, approvedSnapshotId: "legacy-snapshot", proposedSnapshotId: null,
    });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "RESTORE", expectedVersion: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ state: "published", published: true });
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ snapshotId: "legacy-snapshot" }) });
  });

  it("audits staff enforcement against the approved public snapshot while an edit is pending", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: true, lifecycleState: "SUBMITTED", lifecycleVersion: 7,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: "public-snapshot", proposedSnapshotId: "pending-snapshot",
      proposedSnapshot: { content: marketplaceManifestFixture(), schemaVersion: 1, releaseManifest: { id: "pending-release", publishedAt: null, sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } },
      approvedSnapshot: { schemaVersion: 1, releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } },
      lifecycleEvents: [],
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.marketplaceProduct.update.mockResolvedValue({
      id: "product-1", slug: "owned-skill", lifecycleState: "SUSPENDED", lifecycleVersion: 8,
      published: false, approvedSnapshotId: "public-snapshot", proposedSnapshotId: "pending-snapshot",
    });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "SUSPEND", expectedVersion: 7, publicReason: "The public release requires a safety review." });

    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      snapshotId: "public-snapshot", action: "SUSPENDED",
    }) });
  });

  it("does not reveal or transition another creator's listing", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-2", slug: "other-skill", published: false, lifecycleState: "DRAFT", lifecycleVersion: 0,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-1",
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } },
      approvedSnapshot: null,
      creator: { ownerUserId: "reader-2" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-2/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "SUBMIT", expectedVersion: 0 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LISTING_NOT_FOUND");
    expect(prismaMock.marketplaceProduct.update).not.toHaveBeenCalled();
  });

  it("returns an owner-scoped creator dashboard with completed acquisitions and public feedback", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findMany.mockResolvedValueOnce([{
      id: "product-1", slug: "owned-skill", name: "Owned Skill", itemType: "SKILL", type: "Skill",
      lifecycleState: "CHANGES_REQUESTED", lifecycleVersion: 3, published: false,
      rating: 4.5, reviewCount: 2, version: "1.1.0", updatedAt: new Date("2026-09-16T10:00:00.000Z"),
      versions: [{ version: "1.1.0", releasedAt: new Date("2026-09-15T10:00:00.000Z") }],
      lifecycleEvents: [{ id: "event-2", action: "CHANGES_REQUESTED", resultingState: "CHANGES_REQUESTED", publicReason: "Clarify network access.", createdAt: new Date("2026-09-16T09:00:00.000Z") }],
      _count: { versions: 2, orders: 7 },
    }]).mockResolvedValueOnce([
      // Weighted by reviews: (4.5 × 2 + 3.0 × 6) / 8 = 3.375, shown as 3.4.
      { rating: 4.5, reviewCount: 2 },
      { rating: 3.0, reviewCount: 6 },
    ]);
    prismaMock.marketplaceProduct.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prismaMock.marketplaceOrder.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    prismaMock.marketplaceListingLifecycleEvent.findMany.mockResolvedValue([{
      productId: "product-1", action: "CHANGES_REQUESTED", reasonCode: "PERMISSIONS_UNCLEAR",
      publicReason: "Clarify network access.", createdAt: new Date("2026-09-16T09:00:00.000Z"),
    }]);

    const response = await request(createApp())
      .get("/api/marketplace/creator/dashboard?page=1&limit=12")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual({
      totalListings: 1, publishedListings: 0, inReviewListings: 0, totalAcquisitions: 7,
      acquisitionsLast7Days: 3, acquisitionsPrevious7Days: 1, averageRating: 3.4, ratedReviewCount: 8,
    });
    expect(response.body.data.listings[0]).toMatchObject({
      id: "product-1", typeKey: "skill", state: "changes_requested", acquisitionCount: 7,
      releaseCount: 2, moderationFeedback: { reasonCode: "PERMISSIONS_UNCLEAR", message: "Clarify network access." },
    });
    expect(response.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { creator: { ownerUserId: "reader-1" } }, skip: 0, take: 12,
      select: expect.objectContaining({ lifecycleEvents: expect.objectContaining({ where: { action: { not: "INTERNAL_NOTE_ADDED" } } }) }),
    }));
    expect(prismaMock.marketplaceOrder.count).toHaveBeenCalledWith({
      where: { status: "completed", product: { creator: { ownerUserId: "reader-1" } } },
    });
    expect(prismaMock.marketplaceOrder.count).toHaveBeenCalledWith({
      where: { status: "completed", product: { creator: { ownerUserId: "reader-1" } }, createdAt: { gte: expect.any(Date) } },
    });
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith({
      where: { creator: { ownerUserId: "reader-1" }, reviewCount: { gt: 0 } },
      select: { rating: true, reviewCount: true },
    });
  });

  it("exposes restore targets only for recoverable creator archives using the latest owner-scoped archive event", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1", user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    const cases = [
      { id: "public", lifecycleState: "ARCHIVED", lifecycleResumeState: "SUBMITTED", lifecycleResumePublished: true, actor: "CREATOR", target: { state: "submitted", published: true } },
      { id: "private", lifecycleState: "ARCHIVED", lifecycleResumeState: "DRAFT", lifecycleResumePublished: false, actor: "CREATOR", target: { state: "draft", published: false } },
      { id: "staff", lifecycleState: "ARCHIVED", lifecycleResumeState: "PUBLISHED", lifecycleResumePublished: true, actor: "MODERATOR", target: null },
      { id: "missing-state", lifecycleState: "ARCHIVED", lifecycleResumeState: null, lifecycleResumePublished: false, actor: "CREATOR", target: null },
      { id: "missing-visibility", lifecycleState: "ARCHIVED", lifecycleResumeState: "DRAFT", lifecycleResumePublished: null, actor: "CREATOR", target: null },
      { id: "unknown-actor", lifecycleState: "ARCHIVED", lifecycleResumeState: "DRAFT", lifecycleResumePublished: false, actor: null, target: null },
      { id: "suspended", lifecycleState: "SUSPENDED", lifecycleResumeState: "PUBLISHED", lifecycleResumePublished: true, actor: "CREATOR", target: null },
    ];
    prismaMock.marketplaceProduct.findMany.mockResolvedValueOnce(cases.map((item) => ({
      ...item, slug: item.id, name: item.id, itemType: "SKILL", type: "Skill", lifecycleVersion: 4, published: false,
      rating: 0, reviewCount: 0, version: "1.0.0", updatedAt: new Date(), versions: [],
      lifecycleEvents: [{ id: "recent-non-archive", action: "DRAFT_SAVED", resultingState: item.lifecycleState, publicReason: null, createdAt: new Date() }],
      _count: { versions: 1, orders: 2 },
    }))).mockResolvedValueOnce([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(cases.length);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);
    prismaMock.marketplaceListingLifecycleEvent.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(cases.filter((item) => item.actor).map((item) => ({ productId: item.id, actorType: item.actor })));
    const response = await request(createApp()).get("/api/marketplace/creator/dashboard?page=1&limit=12")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");
    expect(response.status).toBe(200);
    expect(response.body.data.listings.map((item: { restoreTarget: unknown }) => item.restoreTarget)).toEqual(cases.map((item) => item.target));
    expect(prismaMock.marketplaceListingLifecycleEvent.findMany).toHaveBeenLastCalledWith({
      where: { productId: { in: cases.filter((item) => item.lifecycleState === "ARCHIVED").map((item) => item.id) }, product: { creator: { ownerUserId: "reader-1" } }, action: "ARCHIVED" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], distinct: ["productId"], select: { productId: true, actorType: true },
    });
    expect(response.body.data.listings[0]).not.toHaveProperty("actorType");
    expect(response.body.data.listings[0]).not.toHaveProperty("lifecycleResumeState");
  });

  it("reports no average rating, rather than zero, when nothing has been reviewed", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(0);

    const response = await request(createApp())
      .get("/api/marketplace/creator/dashboard")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toMatchObject({ averageRating: null, ratedReviewCount: 0, acquisitionsLast7Days: 0 });
  });

  it("does not expose the creator dashboard without an active creator grant", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });

    const response = await request(createApp())
      .get("/api/marketplace/creator/dashboard")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MARKETPLACE_ROLE_REQUIRED");
    expect(prismaMock.marketplaceProduct.findMany).not.toHaveBeenCalled();
  });

  it("returns immutable release history only to the listing owner", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", name: "Owned Skill", lifecycleState: "PUBLISHED", lifecycleVersion: 4,
      published: true, approvedSnapshotId: "snapshot-1", proposedSnapshotId: "snapshot-2", creator: { ownerUserId: "reader-1" },
      versions: [{
        id: "version-1", version: "1.0.0", notes: "Initial release", releasedAt: new Date("2026-09-15T00:00:00.000Z"),
        releaseManifests: [{
          id: "release-1", revision: 1, sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/item",
          sourceRef: "a".repeat(40), sourcePath: "skill", providerIntegrityDigest: null,
          artifactSizeBytes: null, resolvedInstallationUrl: "https://github.com/example/item/archive/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.tar.gz",
          sourceResolvedAt: new Date("2026-09-15T01:00:00.000Z"), ownershipVerifiedAt: new Date("2026-09-15T01:00:00.000Z"),
          sourceCheckStatus: "VERIFIED", sourceCheckedAt: new Date("2026-09-15T01:00:00.000Z"), sourceNextCheckAt: null, sourceFailureCount: 0, lastSourceErrorCode: null,
          publishedAt: new Date("2026-09-16T00:00:00.000Z"), createdAt: new Date("2026-09-15T00:00:00.000Z"),
          listingSnapshots: [{ id: "snapshot-1", revision: 1 }], _count: { acquisitions: 3 },
        }],
      }],
    });

    const response = await request(createApp())
      .get("/api/marketplace/creator/products/product-1/releases")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.releases[0]).toMatchObject({
      id: "release-1", version: "1.0.0", status: "published", isCurrent: true, acquisitionCount: 3,
      source: { kind: "github_repository", url: "https://github.com/example/item", path: "skill" },
    });
  });

  it("does not reveal release provenance to another creator", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-2", slug: "other-skill", name: "Other Skill", lifecycleState: "DRAFT", lifecycleVersion: 1,
      published: false, approvedSnapshotId: null, proposedSnapshotId: "snapshot-2", creator: { ownerUserId: "reader-2" }, versions: [],
    });

    const response = await request(createApp())
      .get("/api/marketplace/creator/products/product-2/releases")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LISTING_NOT_FOUND");
  });

  it("lists provider connections without returning encrypted credentials", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue({ id: "creator-1" });
    prismaMock.marketplaceProviderConnection.findMany.mockResolvedValue([{
      id: "connection-1", provider: "GITHUB", accountLogin: "source-owner", lastVerifiedAt: new Date("2026-09-18T10:00:00.000Z"),
      revokedAt: null, createdAt: new Date("2026-09-18T10:00:00.000Z"), updatedAt: new Date("2026-09-18T10:00:00.000Z"),
      encryptedToken: "must-not-leak", tokenIv: "must-not-leak", tokenTag: "must-not-leak",
    }]);

    const response = await request(createApp())
      .get("/api/marketplace/creator/provider-connections")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ provider: "github", accountLogin: "source-owner" });
    expect(JSON.stringify(response.body)).not.toContain("must-not-leak");
  });

  it("queues one idempotent source check for the owned proposed release", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      lifecycleVersion: 4,
      creator: { id: "creator-1", ownerUserId: "reader-1" },
      proposedSnapshot: { releaseManifest: { id: "release-2", sourceKind: "GITHUB_REPOSITORY", publishedAt: null } },
    });
    prismaMock.marketplaceProviderConnection.findUnique.mockResolvedValue({ id: "connection-1", revokedAt: null });
    prismaMock.marketplaceSourceCheckJob.findFirst.mockResolvedValue(null);
    prismaMock.marketplaceSourceCheckJob.create.mockResolvedValue({ id: "job-1", status: "PENDING", correlationId: "source-check-1" });
    prismaMock.marketplaceReleaseManifest.update.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-1/source-check")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ expectedVersion: 4 });

    expect(response.status).toBe(202);
    expect(response.body.data).toMatchObject({ id: "job-1", status: "pending", correlationId: "source-check-1" });
    expect(prismaMock.marketplaceSourceCheckJob.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      releaseManifestId: "release-2", connectionId: "connection-1", requestedByUserId: "reader-1",
    }), select: expect.any(Object) });
  });

  it("pins a free acquisition to the exact approved release", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({
      id: "product-1", slug: "owned-skill", priceMinor: 0, currency: "USD", pricingModel: "free",
      approvedSnapshot: { releaseManifest: { id: "release-1", publishedAt: new Date("2026-09-16T00:00:00.000Z"), sourceCheckStatus: "VERIFIED" } },
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceOrder.create.mockResolvedValue({ id: "order-1", status: "completed", releaseManifestId: "release-1", createdAt: new Date("2026-09-18T10:00:00.000Z"), userId: "reader-1", idempotencyKey: "secret-key" });
    prismaMock.marketplaceProduct.update.mockResolvedValue({});
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/products/owned-skill/acquire")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .set("Idempotency-Key", "acquire-owned-skill-0001");

    expect(response.status).toBe(201);
    expect(prismaMock.marketplaceOrder.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      productId: "product-1", userId: "reader-1", releaseManifestId: "release-1", status: "completed",
    }) });
    expect(response.body.data).toMatchObject({ id: "order-1", status: "completed", releaseManifestId: "release-1" });
    expect(response.body.data).not.toHaveProperty("userId");
    expect(response.body.data).not.toHaveProperty("idempotencyKey");
  });

  describe("adding the release the reader inspected", () => {
    const signedIn = () => prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    const product = {
      id: "product-1", slug: "owned-skill", priceMinor: 0, currency: "USD", pricingModel: "free",
      approvedSnapshot: { releaseManifest: { id: "release-2", publishedAt: new Date("2026-09-16T00:00:00.000Z"), sourceCheckStatus: "VERIFIED" } },
    };
    const older = {
      id: "release-1", publishedAt: new Date("2026-08-01T00:00:00.000Z"), sourceCheckStatus: "VERIFIED",
      sourceKind: "NPM", resolvedInstallationUrl: "https://registry.npmjs.org/@acme/tool/-/tool-1.0.0.tgz",
    };
    const acquire = (body?: object, key = "acquire-owned-skill-0002") => {
      const call = request(createApp())
        .post("/api/marketplace/products/owned-skill/acquire")
        .set("Origin", "http://localhost:3000")
        .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
        .set("Idempotency-Key", key);
      return body ? call.send(body) : call;
    };
    const order = { id: "order-1", status: "completed", releaseManifestId: "release-1", createdAt: new Date("2026-09-18T10:00:00.000Z"), userId: "reader-1", productId: "product-1" };

    it("pins the named release instead of the approved one", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(older);
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);
      prismaMock.marketplaceOrder.create.mockResolvedValue(order);
      prismaMock.marketplaceProduct.update.mockResolvedValue({});
      prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

      const response = await acquire({ version: "1.0.0" });

      expect(response.status).toBe(201);
      expect(prismaMock.marketplaceReleaseManifest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ productVersion: { productId: "product-1", version: "1.0.0" }, publishedAt: { not: null } }),
      }));
      expect(prismaMock.marketplaceOrder.create).toHaveBeenCalledWith({ data: expect.objectContaining({ releaseManifestId: "release-1" }) });
    });

    it("refuses a version that is not a published, verified release", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(null);
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

      const response = await acquire({ version: "9.9.9" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("RELEASE_UNAVAILABLE");
      expect(prismaMock.marketplaceOrder.create).not.toHaveBeenCalled();
    });

    it("refuses a named release whose source is not a trusted host", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue({ ...older, resolvedInstallationUrl: "https://evil.example/tool.tgz" });
      prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

      const response = await acquire({ version: "1.0.0" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("RELEASE_UNAVAILABLE");
      expect(prismaMock.marketplaceOrder.create).not.toHaveBeenCalled();
    });

    it("does not hand back a different release the reader already holds", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(older);
      prismaMock.marketplaceOrder.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...order, releaseManifestId: "release-2" });

      const response = await acquire({ version: "1.0.0" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ALREADY_IN_LIBRARY");
      expect(prismaMock.marketplaceOrder.create).not.toHaveBeenCalled();
    });

    it("returns the held release when the same one is named again", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(older);
      prismaMock.marketplaceOrder.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(order);

      const response = await acquire({ version: "1.0.0" });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ releaseManifestId: "release-1" });
    });

    it("rejects a replayed key that named another release", async () => {
      signedIn();
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(product);
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(older);
      prismaMock.marketplaceOrder.findUnique.mockResolvedValueOnce({ ...order, releaseManifestId: "release-2" });

      const response = await acquire({ version: "1.0.0" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    });

    it.each([[{ version: "" }], [{ version: "x".repeat(65) }], [{ version: "1.0.0", extra: true }], [{ version: 3 }]])("rejects a malformed body %j", async (body) => {
      signedIn();

      const response = await acquire(body);

      expect(response.status).toBe(400);
      expect(prismaMock.marketplaceOrder.create).not.toHaveBeenCalled();
    });
  });

  describe("one published release", () => {
    const releaseRow = {
      sourceKind: "NPM", sourceUrl: "https://registry.npmjs.org/@acme/tool", sourceRef: "1.0.0", sourcePath: null,
      providerIntegrityDigest: null, artifactSizeBytes: null, sourceCheckStatus: "VERIFIED", sourceCheckedAt: new Date("2026-10-01T00:00:00Z"),
      resolvedInstallationUrl: "https://registry.npmjs.org/@acme/tool/-/tool-1.0.0.tgz", installationMethod: "NPM",
      licenseIdentifier: "MIT", customLicenseUrl: null, installationInstructions: ["private installation step"],
      productVersion: { version: "1.0.0" }, permissions: [], environmentVariables: [], mcpServerDetails: null,
    };

    it("shows an older release's own facts and says it is not the current one", async () => {
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue({ id: "product-1" });
      prismaMock.marketplaceReleaseManifest.findFirst
        .mockResolvedValueOnce(releaseRow)
        .mockResolvedValueOnce({ ...releaseRow, sourceRef: "2.0.0", productVersion: { version: "2.0.0" } });

      const response = await request(createApp()).get("/api/marketplace/products/published-skill/releases/1.0.0");

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ version: "1.0.0", current: false, source: { ref: "1.0.0", integrityDigest: null }, license: "MIT" });
      expect(prismaMock.marketplaceReleaseManifest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ productVersion: { productId: "product-1", version: "1.0.0" } }),
      }));
      expect(JSON.stringify(response.body)).not.toContain("private installation step");
    });

    it("is a 404 for an unpublished listing or a version that was never published", async () => {
      prismaMock.marketplaceProduct.findFirst.mockResolvedValue(null);
      expect((await request(createApp()).get("/api/marketplace/products/private-skill/releases/1.0.0")).status).toBe(404);

      prismaMock.marketplaceProduct.findFirst.mockResolvedValue({ id: "product-1" });
      prismaMock.marketplaceReleaseManifest.findFirst.mockResolvedValue(null);
      const response = await request(createApp()).get("/api/marketplace/products/published-skill/releases/9.9.9");
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("RELEASE_NOT_FOUND");
    });
  });

  it("returns installation details for the exact release acquired by the reader", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({
      id: "order-1", status: "completed", createdAt: new Date("2026-09-18T10:00:00.000Z"),
      product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", published: true },
      releaseManifest: {
        id: "release-1", sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/owned-skill", sourceRef: "a".repeat(40), sourcePath: "skill",
        providerIntegrityDigest: null, artifactSizeBytes: 4096, resolvedInstallationUrl: `https://github.com/example/owned-skill/archive/${"a".repeat(40)}.tar.gz`,
        sourceCheckStatus: "VERIFIED", sourceCheckedAt: new Date("2026-09-18T09:00:00.000Z"), installationMethod: "MANUAL",
        installationInstructions: ["Extract the archive", "Copy the skill directory"], runtimeRequirements: [], accountRequirements: [], operatingSystems: [], dependencyRequirements: [],
        documentationUrl: "https://github.com/example/owned-skill#readme", supportUrl: null, licenseIdentifier: "MIT", customLicenseUrl: null,
        publishedAt: new Date("2026-09-17T00:00:00.000Z"), productVersion: { productId: "product-1", version: "1.0.0" },
      },
    });

    const response = await request(createApp())
      .get("/api/marketplace/products/owned-skill/installation")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.body.data).toMatchObject({
      acquisition: { id: "order-1", status: "completed" },
      product: { slug: "owned-skill" },
      release: {
        id: "release-1", version: "1.0.0",
        source: { kind: "github_repository", ref: "a".repeat(40), status: "verified" },
        installation: { method: "manual", instructions: ["Extract the archive", "Copy the skill directory"] },
      },
    });
    expect(prismaMock.marketplaceOrder.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "reader-1", status: "completed", product: { slug: "owned-skill" } },
    }));
  });

  it("lists the reader's acquired releases without exposing installation URLs", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([{
      id: "order-1", createdAt: new Date("2026-09-18T10:00:00.000Z"),
      product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", type: "Skill", itemType: "SKILL", outcome: "Completes a task", published: true, creator: { name: "Creator", handle: "creator" } },
      releaseManifest: { id: "release-1", sourceCheckStatus: "VERIFIED", resolvedInstallationUrl: "must-not-leak", productVersion: { version: "1.0.0" } },
    }]);
    prismaMock.marketplaceOrder.count.mockResolvedValue(1);

    const response = await request(createApp())
      .get("/api/marketplace/library")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({
      acquisitionId: "order-1", product: { slug: "owned-skill", typeKey: "skill" },
      release: { id: "release-1", version: "1.0.0", sourceStatus: "verified" }, installationAvailable: true,
    });
    expect(response.body.meta).toEqual({ page: 1, limit: 24, total: 1, totalPages: 1 });
    expect(JSON.stringify(response.body)).not.toContain("must-not-leak");
    expect(prismaMock.marketplaceOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "reader-1", status: "completed" } }));
  });

  it("does not reveal installation data without the reader's acquisition", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-2", email: "other@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null);

    const response = await request(createApp())
      .get("/api/marketplace/products/owned-skill/installation")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACQUISITION_NOT_FOUND");
    expect(JSON.stringify(response.body)).not.toContain("github.com");
  });

  it("blocks installation when the acquired release is restricted", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({
      id: "order-1", status: "completed", createdAt: new Date(),
      product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", published: true },
      releaseManifest: {
        id: "release-1", publishedAt: new Date(), sourceCheckStatus: "RESTRICTED", resolvedInstallationUrl: "https://github.com/private-value",
        productVersion: { productId: "product-1", version: "1.0.0" },
      },
    });

    const response = await request(createApp())
      .get("/api/marketplace/products/owned-skill/installation")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INSTALLATION_UNAVAILABLE");
    expect(JSON.stringify(response.body)).not.toContain("private-value");
  });

  it("rejects an installation URL outside the verified provider hosts", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({
      id: "order-1", status: "completed", createdAt: new Date(),
      product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", published: true },
      releaseManifest: {
        id: "release-1", sourceKind: "GITHUB_REPOSITORY", publishedAt: new Date(), sourceCheckStatus: "VERIFIED",
        resolvedInstallationUrl: "https://attacker.example/payload", productVersion: { productId: "product-1", version: "1.0.0" },
      },
    });

    const response = await request(createApp())
      .get("/api/marketplace/products/owned-skill/installation")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INSTALLATION_UNAVAILABLE");
    expect(JSON.stringify(response.body)).not.toContain("attacker.example");
  });

  it("refuses acquisition when a public listing has no approved release", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] },
    });
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({
      id: "product-1", slug: "legacy-skill", priceMinor: 0, currency: "USD", pricingModel: "free", approvedSnapshot: null,
    });
    prismaMock.marketplaceOrder.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .post("/api/marketplace/products/legacy-skill/acquire")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .set("Idempotency-Key", "acquire-legacy-skill-0001");

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("RELEASE_UNAVAILABLE");
    expect(prismaMock.marketplaceOrder.create).not.toHaveBeenCalled();
  });

  it("returns the staff moderation queue with source readiness and self-review flags", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([{
      id: "product-1", slug: "review-skill", name: "Review Skill", itemType: "SKILL", type: "Skill",
      lifecycleState: "SUBMITTED", lifecycleVersion: 3, published: false, updatedAt: new Date("2026-09-17T08:00:00.000Z"),
      creator: { name: "Creator", handle: "creator", ownerUserId: "reader-1" },
      proposedSnapshot: {
        revision: 2, createdAt: new Date("2026-09-17T07:00:00.000Z"), _count: { communityRequests: 1 },
        content: { release: { permissions: [
          { capability: "secret_access", purpose: "Reads API keys" },
          { capability: "network_access", required: false, purpose: "Calls the provider" },
          { purpose: "Malformed entry without a capability" },
        ] } },
        releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: null, productVersion: { version: "1.1.0" } },
      },
    }, {
      id: "product-2", slug: "legacy-skill", name: "Legacy Skill", itemType: null, type: "Skill",
      lifecycleState: "APPROVED", lifecycleVersion: 1, published: false, updatedAt: new Date("2026-09-17T09:00:00.000Z"),
      creator: { name: "Creator", handle: "creator", ownerUserId: "reader-1" },
      proposedSnapshot: { revision: 1, createdAt: new Date(), _count: { communityRequests: 0 }, content: { schemaVersion: 0, legacy: true }, releaseManifest: null },
    }]);
    prismaMock.marketplaceProduct.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const response = await request(createApp())
      .get("/api/marketplace/moderation/queue?state=review&page=1&limit=24")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual({ submitted: 1, approved: 0, awaitingAction: 1 });
    expect(response.body.data.listings[0]).toMatchObject({
      id: "product-1", state: "submitted", selfOwned: false, sourceResolved: true,
      ownershipVerified: false, communityRequestCount: 1, releaseVersion: "1.1.0",
      capabilities: [{ capability: "secret_access", required: true }, { capability: "network_access", required: false }],
    });
    expect(response.body.data.listings[1].capabilities).toEqual([]);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { lifecycleState: { in: ["SUBMITTED", "APPROVED"] }, NOT: { creator: { ownerUserId: "moderator-1" } } }, skip: 0, take: 24,
    }));
  });

  it("shows a listing with nothing pending what its approved version declares, not an empty list", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findMany
      .mockResolvedValueOnce([{
        id: "product-3", slug: "live-skill", name: "Live Skill", itemType: "SKILL", type: "Skill",
        lifecycleState: "PUBLISHED", lifecycleVersion: 5, published: true, updatedAt: new Date("2026-09-17T08:00:00.000Z"),
        creator: { name: "Creator", handle: "creator", ownerUserId: "reader-1" }, proposedSnapshot: null,
      }])
      .mockResolvedValueOnce([{ id: "product-3", approvedSnapshot: { content: { release: { version: "2.0.0", permissions: [{ capability: "secret_access", purpose: "Reads keys" }] } } } }]);
    prismaMock.marketplaceProduct.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const response = await request(createApp())
      .get("/api/marketplace/moderation/queue?state=published&page=1&limit=24")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.listings[0]).toMatchObject({ id: "product-3", releaseVersion: "2.0.0", capabilities: [{ capability: "secret_access", required: true }] });
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: { in: ["product-3"] } } }));
  });

  it("does not expose the moderation queue to creators", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });

    const response = await request(createApp())
      .get("/api/marketplace/moderation/queue")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MARKETPLACE_ROLE_REQUIRED");
    expect(prismaMock.marketplaceProduct.findMany).not.toHaveBeenCalled();
  });

  it("records a standalone internal note as an append-only staff audit event", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", lifecycleState: "SUBMITTED", lifecycleVersion: 3,
      proposedSnapshotId: "snapshot-2", approvedSnapshotId: null, creator: { ownerUserId: "reader-1" },
    });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({ id: "event-note", createdAt: new Date("2026-09-17T09:00:00.000Z") });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/notes")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ expectedVersion: 3, note: "Compare the newly requested network destination." });

    expect(response.status).toBe(201);
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "product-1", snapshotId: "snapshot-2", previousState: "SUBMITTED", resultingState: "SUBMITTED",
        action: "INTERNAL_NOTE_ADDED", actorType: "MODERATOR", actorUserId: "moderator-1",
        internalNote: "Compare the newly requested network destination.",
      }),
      select: { id: true, createdAt: true },
    });
  });

  it("exposes private notes only through the staff moderation preview", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "review-skill", name: "Review Skill", type: "Skill", itemType: "SKILL",
      lifecycleState: "SUBMITTED", lifecycleVersion: 3, published: false, updatedAt: new Date("2026-09-17T08:00:00.000Z"),
      creator: { id: "creator-1", name: "Creator", handle: "creator", ownerUserId: "reader-1" },
      proposedSnapshot: { id: "snapshot-2", revision: 2, schemaVersion: 1, digestSha256: "a".repeat(64), content: marketplaceManifestFixture(), createdAt: new Date(), releaseManifest: null, communityRequests: [] },
      approvedSnapshot: null,
      lifecycleEvents: [{
        id: "event-note", previousState: "SUBMITTED", resultingState: "SUBMITTED", action: "INTERNAL_NOTE_ADDED",
        actorType: "MODERATOR", actorUserId: "moderator-1", reasonCode: "INTERNAL_NOTE_ADDED", publicReason: null,
        internalNote: "Private investigation context.", correlationId: "correlation-1", createdAt: new Date("2026-09-17T09:00:00.000Z"),
      }],
    });

    const response = await request(createApp())
      .get("/api/marketplace/moderation/products/product-1")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.auditTrail[0]).toMatchObject({ action: "internal_note_added", internalNote: "Private investigation context." });
    expect(response.body.data.auditTrailTruncated).toBe(false);
    expect(response.body.data.proposedSnapshot.content.listing.slug).toBe("owned-skill");
  });

  it("does not expose private moderation notes to staff reviewing their own listing", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({ id: "product-1", creator: { ownerUserId: "moderator-1" } });

    const response = await request(createApp())
      .get("/api/marketplace/moderation/products/product-1")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SELF_MODERATION_FORBIDDEN");
  });

  it("prevents staff from adding internal notes to their own listing", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", lifecycleState: "SUBMITTED", lifecycleVersion: 3,
      proposedSnapshotId: "snapshot-2", approvedSnapshotId: null, creator: { ownerUserId: "moderator-1" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/notes")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ expectedVersion: 3, note: "This should not be accepted." });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SELF_MODERATION_FORBIDDEN");
    expect(prismaMock.marketplaceListingLifecycleEvent.create).not.toHaveBeenCalled();
  });

  it("approves a community placement with an append-only moderation event", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceCommunity.findUnique.mockResolvedValue({ id: "community-1", state: "ACTIVE" });
    prismaMock.marketplaceCommunityPlacement.findUnique.mockResolvedValue({
      id: "placement-1", state: "REQUESTED", version: 1, requestedSnapshotId: "snapshot-1",
      product: { creator: { ownerUserId: "reader-1" } },
    });
    prismaMock.marketplaceCommunityPlacement.update.mockResolvedValue({
      id: "placement-1", state: "APPROVED", version: 2, publicReason: null, decidedAt: new Date(),
    });
    prismaMock.marketplaceCommunityPlacementEvent.create.mockResolvedValue({});
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/community-placements/codex")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "APPROVE", expectedVersion: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: "placement-1", state: "approved", version: 2 });
    expect(prismaMock.marketplaceCommunityPlacementEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      placementId: "placement-1", snapshotId: "snapshot-1", previousState: "REQUESTED", resultingState: "APPROVED",
      action: "APPROVED", actorType: "MODERATOR", actorUserId: "moderator-1",
    }) });
  });

  it("prevents staff from deciding their own community placement", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceCommunity.findUnique.mockResolvedValue({ id: "community-1", state: "ACTIVE" });
    prismaMock.marketplaceCommunityPlacement.findUnique.mockResolvedValue({
      id: "placement-1", state: "REQUESTED", version: 1, requestedSnapshotId: "snapshot-1",
      product: { creator: { ownerUserId: "moderator-1" } },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/community-placements/codex")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "APPROVE", expectedVersion: 1 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SELF_MODERATION_FORBIDDEN");
    expect(prismaMock.marketplaceCommunityPlacement.update).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceCommunityPlacementEvent.create).not.toHaveBeenCalled();
  });

  it("returns only the authenticated creator's current draft", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", name: "Owned Skill", lifecycleState: "DRAFT", lifecycleVersion: 2, published: false,
      creator: { ownerUserId: "reader-1" },
      proposedSnapshot: { revision: 2, content: marketplaceManifestFixture(), createdAt: new Date("2026-09-16T10:00:00.000Z") },
    });

    const response = await request(createApp())
      .get("/api/marketplace/creator/products/product-1/draft")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: "product-1", state: "draft", version: 2, draft: { revision: 2 } });
  });

  it("creates an owner-scoped immutable draft revision and audit event", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceCreator.findUnique.mockResolvedValue({ id: "creator-1" });
    prismaMock.marketplaceCategory.findUnique.mockResolvedValue({ id: "category-1" });
    prismaMock.marketplaceCommunity.findMany.mockResolvedValue([{ id: "community-1", slug: "codex" }]);
    prismaMock.marketplaceCommunityPlacement.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceProduct.create.mockResolvedValue({ id: "product-1", published: false, lifecycleState: "DRAFT", lifecycleVersion: 0 });
    prismaMock.marketplaceListingSnapshot.aggregate.mockResolvedValue({ _max: { revision: null } });
    prismaMock.marketplaceManifestSnapshot.create.mockResolvedValue({ id: "manifest-1" });
    prismaMock.marketplaceProductVersion.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceProductVersion.create.mockResolvedValue({ id: "version-1" });
    prismaMock.marketplaceReleaseManifest.create.mockResolvedValue({ id: "release-1" });
    prismaMock.marketplaceSkillReleaseDetails.create.mockResolvedValue({});
    prismaMock.marketplaceListingSnapshot.create.mockResolvedValue({ id: "snapshot-1", revision: 1, createdAt: new Date("2026-09-16T10:00:00.000Z") });
    prismaMock.marketplaceCommunityPlacementRequest.createMany.mockResolvedValue({ count: 1 });
    prismaMock.marketplaceProduct.update.mockResolvedValue({ id: "product-1", slug: "owned-skill", name: "Owned Skill", lifecycleState: "DRAFT", lifecycleVersion: 1, published: false });
    prismaMock.marketplaceListingLifecycleEvent.create.mockResolvedValue({});
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ manifest: marketplaceManifestFixture() });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ id: "product-1", state: "draft", version: 1, published: false, draft: { revision: 1 } });
    // Prisma rejects `deleteMany` inside a nested create; the mock would not.
    expect(prismaMock.marketplaceProduct.create.mock.calls[0][0].data.compatibility).toEqual({ create: [{ platformKey: "codex" }] });
    expect(prismaMock.marketplaceCommunityPlacementRequest.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ snapshotId: "snapshot-1", communityId: "community-1", productId: "product-1", requestedByUserId: "reader-1" })] });
    expect(prismaMock.marketplaceCommunityPlacement.create).toHaveBeenCalledWith({ data: {
      productId: "product-1", communityId: "community-1", requestedSnapshotId: "snapshot-1", requestedByUserId: "reader-1",
    } });
    expect(prismaMock.marketplaceListingLifecycleEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ snapshotId: "snapshot-1", action: "DRAFT_SAVED", actorUserId: "reader-1" }) });
  });

  it("does not reveal another creator's draft", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-2", slug: "private-skill", name: "Private Skill", lifecycleState: "DRAFT", lifecycleVersion: 1, published: false,
      creator: { ownerUserId: "reader-2" }, proposedSnapshot: { revision: 1, content: marketplaceManifestFixture(), createdAt: new Date() },
    });

    const response = await request(createApp())
      .get("/api/marketplace/creator/products/product-2/draft")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LISTING_NOT_FOUND");
  });

  it("does not let a creator replace another creator's draft", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-2", published: false, lifecycleState: "DRAFT", lifecycleVersion: 1,
      creator: { ownerUserId: "reader-2" }, approvedSnapshot: null,
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .put("/api/marketplace/creator/products/product-2/draft")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ expectedVersion: 1, manifest: marketplaceManifestFixture() });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LISTING_NOT_FOUND");
    expect(prismaMock.marketplaceManifestSnapshot.create).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceListingSnapshot.create).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceProduct.update).not.toHaveBeenCalled();
  });

  it("rejects stale draft saves before creating an immutable snapshot", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", published: false, lifecycleState: "DRAFT", lifecycleVersion: 4,
      creator: { ownerUserId: "reader-1" }, approvedSnapshot: null,
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .put("/api/marketplace/creator/products/product-1/draft")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ expectedVersion: 3, manifest: marketplaceManifestFixture() });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("LISTING_VERSION_CONFLICT");
    expect(prismaMock.marketplaceManifestSnapshot.create).not.toHaveBeenCalled();
  });

  it("rejects stale lifecycle writes before creating an audit event", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: false, lifecycleState: "DRAFT", lifecycleVersion: 4,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-1",
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } }, approvedSnapshot: null,
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "SUBMIT", expectedVersion: 3 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("LISTING_VERSION_CONFLICT");
    expect(prismaMock.marketplaceListingLifecycleEvent.create).not.toHaveBeenCalled();
  });

  it("binds submission to the proposed snapshot's verified release", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "creator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "CREATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: false, lifecycleState: "DRAFT", lifecycleVersion: 0,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-1",
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: null } }, approvedSnapshot: null,
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/creator/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "SUBMIT", expectedVersion: 0 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("SOURCE_VERIFICATION_REQUIRED");
    expect(prismaMock.marketplaceProduct.update).not.toHaveBeenCalled();
  });

  it("prevents staff from moderating their own listing", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });
    prismaMock.marketplaceProduct.findUnique.mockResolvedValue({
      id: "product-1", slug: "owned-skill", published: false, lifecycleState: "SUBMITTED", lifecycleVersion: 1,
      lifecycleResumeState: null, lifecycleResumePublished: null, approvedSnapshotId: null, proposedSnapshotId: "snapshot-1",
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckStatus: "VERIFIED" } },
      approvedSnapshot: null,
      creator: { ownerUserId: "reader-1" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "APPROVE", expectedVersion: 1 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SELF_MODERATION_FORBIDDEN");
    expect(prismaMock.marketplaceListingLifecycleEvent.create).not.toHaveBeenCalled();
  });

  it("requires a public-safe reason for adverse moderation decisions", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "moderator-1", email: "moderator@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "MODERATOR" }] },
    });

    const response = await request(createApp())
      .post("/api/marketplace/moderation/products/product-1/lifecycle")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .send({ action: "REQUEST_CHANGES", expectedVersion: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("PUBLIC_REASON_REQUIRED");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns the same accepted response when verification is throttled", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });
    prismaMock.readerEmailVerification.findFirst.mockResolvedValue({ createdAt: new Date() });
    prismaMock.readerEmailVerification.count.mockResolvedValue(1);
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const response = await request(createApp())
      .post("/api/readers/email-verification/request")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ data: { accepted: true } });
    expect(prismaMock.readerEmailVerification.create).not.toHaveBeenCalled();
  });

  it("consumes a valid verification once and rejects replay", async () => {
    const verification = {
      id: "verification-1",
      userId: "reader-1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { emailVerifiedAt: null },
    };
    const token = createEmailVerificationToken(verification);
    prismaMock.readerEmailVerification.findUnique
      .mockResolvedValueOnce(verification)
      .mockResolvedValueOnce({ ...verification, consumedAt: new Date() });
    prismaMock.readerEmailVerification.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.readerUser.update.mockResolvedValue({});
    prismaMock.transactionalEmailOutbox.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const first = await request(createApp()).post("/api/readers/email-verification/confirm").send({ token });
    const replay = await request(createApp()).post("/api/readers/email-verification/confirm").send({ token });

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ data: { verified: true } });
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe("INVALID_OR_EXPIRED_VERIFICATION");
  });

  it("rejects an expired verification without mutating the account", async () => {
    const verification = {
      id: "verification-expired",
      userId: "reader-1",
      expiresAt: new Date(Date.now() - 1),
      consumedAt: null,
      user: { emailVerifiedAt: null },
    };
    prismaMock.readerEmailVerification.findUnique.mockResolvedValue(verification);
    const token = createEmailVerificationToken(verification);

    const response = await request(createApp()).post("/api/readers/email-verification/confirm").send({ token });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_OR_EXPIRED_VERIFICATION");
    expect(prismaMock.readerUser.update).not.toHaveBeenCalled();
  });

  it("returns the same password-reset response for missing and eligible accounts", async () => {
    prismaMock.readerUser.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "reader-1", passwordHash: "hash" });
    prismaMock.readerPasswordReset.findFirst.mockResolvedValue(null);
    prismaMock.readerPasswordReset.count.mockResolvedValue(0);
    prismaMock.readerPasswordReset.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.readerPasswordReset.create.mockResolvedValue({});
    prismaMock.transactionalEmailOutbox.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const missing = await request(createApp()).post("/api/readers/password-reset/request").send({ email: "missing@example.com" });
    const eligible = await request(createApp()).post("/api/readers/password-reset/request").send({ email: "reader@example.com" });

    expect(missing.status).toBe(202);
    expect(eligible.status).toBe(202);
    expect(missing.body).toEqual(eligible.body);
    expect(prismaMock.readerPasswordReset.create).toHaveBeenCalledWith({
      data: { userId: "reader-1", expiresAt: expect.any(Date), outbox: { create: { correlationId: expect.any(String) } } },
    });
  });

  it("does not create reset jobs for Google-only accounts", async () => {
    prismaMock.readerUser.findUnique.mockResolvedValue({ id: "reader-1", passwordHash: null });

    const response = await request(createApp()).post("/api/readers/password-reset/request").send({ email: "reader@example.com" });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ data: { accepted: true } });
    expect(prismaMock.readerPasswordReset.create).not.toHaveBeenCalled();
  });

  it("counts wrong reset codes and keeps the response generic", async () => {
    const reset = { id: "reset-1", userId: "reader-1", expiresAt: new Date(Date.now() + 60_000), consumedAt: null, failedAttempts: 2 };
    const validCode = createPasswordResetCode(reset);
    const wrongCode = `${validCode.slice(0, 5)}${validCode.endsWith("0") ? "1" : "0"}`;
    prismaMock.readerUser.findUnique.mockResolvedValue({ id: "reader-1", passwordHash: await hash("old-password", 4), emailVerifiedAt: new Date() });
    prismaMock.readerPasswordReset.findFirst.mockResolvedValue(reset);
    prismaMock.readerPasswordReset.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(createApp()).post("/api/readers/password-reset/confirm").send({ email: "reader@example.com", code: wrongCode, newPassword: "new-password" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_OR_EXPIRED_OTP");
    expect(prismaMock.readerPasswordReset.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { failedAttempts: { increment: 1 }, consumedAt: undefined } }));
  });

  it("locks a reset after five failed OTP attempts and does not count expired attempts", async () => {
    const activeReset = { id: "reset-active", userId: "reader-1", expiresAt: new Date(Date.now() + 60_000), consumedAt: null, failedAttempts: 4 };
    const expiredReset = { ...activeReset, id: "reset-expired", expiresAt: new Date(Date.now() - 1), failedAttempts: 0 };
    prismaMock.readerUser.findUnique.mockResolvedValue({ id: "reader-1", passwordHash: "hash", emailVerifiedAt: new Date() });
    prismaMock.readerPasswordReset.findFirst.mockResolvedValueOnce(activeReset).mockResolvedValueOnce(expiredReset);
    prismaMock.readerPasswordReset.updateMany.mockResolvedValue({ count: 1 });
    const validCode = createPasswordResetCode(activeReset);
    const wrongCode = `${validCode.slice(0, 5)}${validCode.endsWith("0") ? "1" : "0"}`;

    const locked = await request(createApp()).post("/api/readers/password-reset/confirm").send({ email: "reader@example.com", code: wrongCode, newPassword: "new-password" });
    const expired = await request(createApp()).post("/api/readers/password-reset/confirm").send({ email: "reader@example.com", code: "000000", newPassword: "new-password" });

    expect(locked.status).toBe(400);
    expect(expired.status).toBe(400);
    expect(prismaMock.readerPasswordReset.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.readerPasswordReset.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { failedAttempts: { increment: 1 }, consumedAt: expect.any(Date) } }));
  });

  it("resets a password once and invalidates every active session", async () => {
    const reset = { id: "reset-1", userId: "reader-1", expiresAt: new Date(Date.now() + 60_000), consumedAt: null, failedAttempts: 0 };
    const user = { id: "reader-1", passwordHash: await hash("old-password", 4), emailVerifiedAt: null };
    prismaMock.readerUser.findUnique.mockResolvedValue(user);
    prismaMock.readerPasswordReset.findFirst.mockResolvedValueOnce(reset).mockResolvedValueOnce(null);
    prismaMock.readerPasswordReset.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.readerUser.update.mockResolvedValue({});
    prismaMock.readerSession.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.transactionalEmailOutbox.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);

    const payload = { email: "reader@example.com", code: createPasswordResetCode(reset), newPassword: "new-password" };
    const first = await request(createApp()).post("/api/readers/password-reset/confirm").send(payload);
    const replay = await request(createApp()).post("/api/readers/password-reset/confirm").send(payload);

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ data: { reset: true } });
    expect(first.headers["set-cookie"][0]).toContain("term_academy_reader=;");
    expect(prismaMock.readerSession.deleteMany).toHaveBeenCalledWith({ where: { userId: "reader-1" } });
    expect(prismaMock.readerUser.update).toHaveBeenCalledWith(expect.objectContaining({ data: { passwordHash: expect.any(String), emailVerifiedAt: expect.any(Date) } }));
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe("INVALID_OR_EXPIRED_OTP");
  });

  it("safely claims an unverified password account with a verified Google identity", async () => {
    verifyGoogleIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-subject-1", email: "reader@example.com", email_verified: true }),
    });
    prismaMock.readerUser.findFirst.mockResolvedValue({
      id: "reader-1",
      email: "reader@example.com",
      googleSubject: null,
      emailVerifiedAt: null,
      marketplaceRoleGrants: [],
    });
    const linkedUser = {
      id: "reader-1",
      email: "reader@example.com",
      googleSubject: "google-subject-1",
      emailVerifiedAt: new Date("2026-09-15T00:00:00.000Z"),
      marketplaceRoleGrants: [],
    };
    prismaMock.readerUser.update.mockReturnValue(Promise.resolve(linkedUser));
    prismaMock.readerSession.deleteMany.mockReturnValue(Promise.resolve({ count: 1 }));
    prismaMock.readerSession.create.mockReturnValue(Promise.resolve({ id: "new-session" }));
    prismaMock.$transaction
      .mockResolvedValueOnce([linkedUser, { count: 1 }])
      .mockResolvedValueOnce([]);

    const response = await request(createApp())
      .post("/api/readers/google")
      .send({ credential: "v".repeat(120) });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      id: "reader-1",
      email: "reader@example.com",
      emailVerified: true,
      marketplaceRoles: [],
    });
    expect(prismaMock.readerUser.update).toHaveBeenCalledWith({
      where: { id: "reader-1" },
      data: {
        googleSubject: "google-subject-1",
        emailVerifiedAt: expect.any(Date),
        passwordHash: null,
      },
      select: expect.any(Object),
    });
    expect(prismaMock.readerSession.deleteMany).toHaveBeenCalledWith({ where: { userId: "reader-1" } });
  });

  it("refuses Google sign-in when it has not been configured", async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    try {
      const response = await request(createApp()).post("/api/readers/google").send({ credential: "v".repeat(120) });
      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe("GOOGLE_NOT_CONFIGURED");
      expect(verifyGoogleIdToken).not.toHaveBeenCalled();
    } finally { process.env.GOOGLE_CLIENT_ID = clientId; }
  });

  it("rejects an unverified Google identity before accessing accounts", async () => {
    verifyGoogleIdToken.mockResolvedValue({ getPayload: () => ({ sub: "google-1", email: "reader@example.com", email_verified: false }) });
    const response = await request(createApp()).post("/api/readers/google").send({ credential: "v".repeat(120) });
    expect(response.status).toBe(401);
    expect(prismaMock.readerUser.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.readerSession.create).not.toHaveBeenCalled();
  });

  it("creates a verified account from a valid Google identity", async () => {
    verifyGoogleIdToken.mockResolvedValue({ getPayload: () => ({ sub: "google-new", email: "reader@example.com", email_verified: true }) });
    prismaMock.readerUser.findFirst.mockResolvedValue(null);
    prismaMock.readerUser.create.mockResolvedValue({ id: "reader-new", email: "reader@example.com", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] });
    const response = await request(createApp()).post("/api/readers/google").send({ credential: "v".repeat(120) });
    expect(response.status).toBe(200);
    expect(response.body.data.user.emailVerified).toBe(true);
    expect(prismaMock.readerUser.create).toHaveBeenCalledWith(expect.objectContaining({ data: { email: "reader@example.com", googleSubject: "google-new", emailVerifiedAt: expect.any(Date) } }));
  });

  it("preserves password sign-in when a verified account connects Google", async () => {
    verifyGoogleIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-subject-1", email: "reader@example.com", email_verified: true }),
    });
    const user = { id: "reader-1", email: "reader@example.com", googleSubject: null, emailVerifiedAt: new Date(), marketplaceRoleGrants: [] };
    prismaMock.readerUser.findFirst.mockResolvedValue(user);
    prismaMock.readerUser.update.mockResolvedValue({ ...user, googleSubject: "google-subject-1" });
    prismaMock.$transaction.mockResolvedValueOnce([{ ...user, googleSubject: "google-subject-1" }]).mockResolvedValueOnce([]);

    const response = await request(createApp()).post("/api/readers/google").send({ credential: "v".repeat(120) });

    expect(response.status).toBe(200);
    const data = prismaMock.readerUser.update.mock.calls[0][0].data;
    expect(data.googleSubject).toBe("google-subject-1");
    expect(data.passwordHash).toBeUndefined();
  });

  it("returns a safe reader profile without authentication secrets", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });
    prismaMock.readerUser.findUnique.mockResolvedValue({
      email: "reader@example.com",
      createdAt: new Date("2026-08-25T00:00:00.000Z"),
      passwordHash: "secret-hash",
      googleSubject: null,
      emailVerifiedAt: null,
    });

    const response = await request(createApp())
      .get("/api/readers/profile")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      email: "reader@example.com",
      hasPassword: true,
      connectedGoogle: false,
      emailVerified: false,
    });
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it("changes a reader password and invalidates other sessions", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });
    prismaMock.readerUser.findUnique.mockResolvedValue({
      passwordHash: await hash("old-password", 4),
    });
    prismaMock.readerUser.update.mockReturnValue(Promise.resolve({ id: "reader-1" }));
    prismaMock.readerSession.deleteMany.mockReturnValue(Promise.resolve({ count: 2 }));

    const response = await request(createApp())
      .put("/api/readers/profile/password")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456")
      .set("Origin", "http://localhost:3001")
      .send({ currentPassword: "old-password", newPassword: "new-password" });

    expect(response.status).toBe(200);
    expect(prismaMock.readerUser.update).toHaveBeenCalledWith({
      where: { id: "reader-1" },
      data: { passwordHash: expect.any(String) },
    });
    expect(prismaMock.readerSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: "reader-1", id: { not: "session-1" } },
    });
  });
});

describe("marketplace reviews", () => {
  const cookie = "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456";
  const reviewBody = { rating: 4, displayName: "Priya", body: "Caught a migration mistake in its first week." };
  const row = { id: "review-1", author: "Priya", rating: 4, body: reviewBody.body, createdAt: new Date("2026-10-01"), updatedAt: new Date("2026-10-01"), hiddenAt: null, hiddenReason: null };

  function signIn(user: { id?: string; emailVerifiedAt?: Date | null; roles?: string[] } = {}) {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: user.id ?? "reader-1", email: "reader@example.com",
        emailVerifiedAt: user.emailVerifiedAt === undefined ? new Date() : user.emailVerifiedAt,
        marketplaceRoleGrants: (user.roles ?? []).map((role) => ({ role })),
      },
    });
  }
  const listing = (ownerUserId = "creator-owner") => ({ id: "product-1", creator: { ownerUserId } });
  function runTransaction() {
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementationOnce(async (operation) => typeof operation === "function" ? operation(prismaMock) : []);
  }
  const put = (body: object = reviewBody) => request(createApp()).put("/api/marketplace/products/owned-skill/reviews").set("Origin", "http://localhost:3000").set("Cookie", cookie).send(body);

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.marketplacePlatform.findMany.mockResolvedValue([]);
  });

  it("tells a reader whether they may review and shows their own review", async () => {
    signIn();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing());
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({ id: "order-1" });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue(row);

    const response = await request(createApp()).get("/api/marketplace/products/owned-skill/reviews/mine").set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.body.data).toMatchObject({ eligibility: "eligible", review: { id: "review-1", rating: 4, hidden: null } });
  });

  it.each([
    ["not_acquired", null, "creator-owner"],
    ["own_listing", { id: "order-1" }, "reader-1"],
  ])("reports %s", async (expected, order, ownerUserId) => {
    signIn();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing(ownerUserId));
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(order);
    prismaMock.marketplaceReview.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).get("/api/marketplace/products/owned-skill/reviews/mine").set("Cookie", cookie);

    expect(response.body.data).toEqual({ eligibility: expected, review: null });
  });

  it("publishes a review from the reader's own account and recomputes the listing rating itself", async () => {
    signIn();
    runTransaction();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing());
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({ id: "order-1" });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceReview.create.mockResolvedValue(row);
    prismaMock.marketplaceReview.aggregate.mockResolvedValue({ _avg: { rating: 4.25 }, _count: { _all: 4 } });
    prismaMock.marketplaceProduct.update.mockResolvedValue({});

    const response = await put();

    expect(response.status).toBe(201);
    expect(prismaMock.marketplaceReview.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ productId: "product-1", userId: "reader-1", author: "Priya", rating: 4, verifiedPurchase: true, published: true }),
    }));
    expect(prismaMock.marketplaceProduct.update).toHaveBeenCalledWith({ where: { id: "product-1" }, data: { rating: 4.3, reviewCount: 4 } });
    expect(JSON.stringify(response.body)).not.toContain("reader-1");
  });

  it("replaces the reader's existing review instead of adding a second", async () => {
    signIn();
    runTransaction();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing());
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({ id: "order-1" });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue({ id: "review-1", hiddenAt: null });
    prismaMock.marketplaceReview.update.mockResolvedValue({ ...row, rating: 2 });
    prismaMock.marketplaceReview.aggregate.mockResolvedValue({ _avg: { rating: 2 }, _count: { _all: 1 } });
    prismaMock.marketplaceProduct.update.mockResolvedValue({});

    const response = await put({ ...reviewBody, rating: 2 });

    expect(response.status).toBe(200);
    expect(prismaMock.marketplaceReview.create).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceReview.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "review-1" } }));
  });

  it("sets the rating to 0 when the last review goes", async () => {
    signIn();
    runTransaction();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({ id: "product-1" });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue({ id: "review-1", hiddenAt: null });
    prismaMock.marketplaceReview.delete.mockResolvedValue({});
    prismaMock.marketplaceReview.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } });
    prismaMock.marketplaceProduct.update.mockResolvedValue({});

    const response = await request(createApp()).delete("/api/marketplace/products/owned-skill/reviews").set("Origin", "http://localhost:3000").set("Cookie", cookie);

    expect(response.status).toBe(204);
    expect(prismaMock.marketplaceProduct.update).toHaveBeenCalledWith({ where: { id: "product-1" }, data: { rating: 0, reviewCount: 0 } });
  });

  it("rejects reviews from people who are signed out, unverified, not in the library, or the creator", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue(null);
    expect((await put()).status).toBe(401);

    signIn({ emailVerifiedAt: null });
    const unverified = await put();
    expect(unverified.status).toBe(403);
    expect(unverified.body.error.code).toBe("EMAIL_VERIFICATION_REQUIRED");

    signIn();
    runTransaction();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing());
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue(null);
    const notAcquired = await put();
    expect(notAcquired.status).toBe(403);
    expect(notAcquired.body.error.code).toBe("ACQUISITION_REQUIRED");

    runTransaction();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing("reader-1"));
    const own = await put();
    expect(own.status).toBe(403);
    expect(own.body.error.code).toBe("OWN_LISTING");
    expect(prismaMock.marketplaceReview.create).not.toHaveBeenCalled();
  });

  it("will not let a reader edit or delete a review a moderator hid", async () => {
    signIn();
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue(listing());
    prismaMock.marketplaceOrder.findFirst.mockResolvedValue({ id: "order-1" });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue({ id: "review-1", hiddenAt: new Date() });

    runTransaction();
    const edit = await put();
    runTransaction();
    const remove = await request(createApp()).delete("/api/marketplace/products/owned-skill/reviews").set("Origin", "http://localhost:3000").set("Cookie", cookie);

    expect([edit.status, edit.body.error.code]).toEqual([409, "REVIEW_HIDDEN"]);
    expect([remove.status, remove.body.error.code]).toEqual([409, "REVIEW_HIDDEN"]);
    expect(prismaMock.marketplaceReview.update).not.toHaveBeenCalled();
    expect(prismaMock.marketplaceReview.delete).not.toHaveBeenCalled();
  });

  it("validates the review and refuses fields the server owns", async () => {
    signIn();
    expect((await put({ ...reviewBody, body: "short" })).status).toBe(400);
    expect((await put({ ...reviewBody, rating: 6 })).status).toBe(400);
    expect((await put({ ...reviewBody, rating: 4.5 })).status).toBe(400);
    expect((await put({ ...reviewBody, displayName: "x" })).status).toBe(400);
    expect((await put({ ...reviewBody, reviewCount: 999 })).status).toBe(400);
    expect((await put({ ...reviewBody, verifiedPurchase: false })).status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("lets a moderator hide a review with a reason, and restore it, recomputing each time", async () => {
    signIn({ id: "moderator-1", roles: ["MODERATOR"] });
    prismaMock.marketplaceReview.findUnique.mockResolvedValue({ id: "review-1", productId: "product-1", product: { creator: { ownerUserId: "creator-owner" } } });
    prismaMock.marketplaceReview.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } });
    prismaMock.marketplaceProduct.update.mockResolvedValue({});
    const moderate = (body: object) => request(createApp()).post("/api/marketplace/moderation/reviews/review-1/visibility").set("Origin", "http://localhost:3000").set("Cookie", cookie).send(body);

    expect((await moderate({ action: "hide" })).status).toBe(400);

    runTransaction();
    prismaMock.marketplaceReview.update.mockResolvedValueOnce({ id: "review-1", hiddenAt: new Date("2026-10-02"), hiddenReason: "Abusive language" });
    const hidden = await moderate({ action: "hide", reason: "Abusive language" });
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.hidden).toMatchObject({ reason: "Abusive language" });
    expect(prismaMock.marketplaceReview.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ published: false, hiddenReason: "Abusive language", hiddenById: "moderator-1" }),
    }));

    runTransaction();
    prismaMock.marketplaceReview.update.mockResolvedValueOnce({ id: "review-1", hiddenAt: null, hiddenReason: null });
    const restored = await moderate({ action: "restore" });
    expect(restored.body.data.hidden).toBeNull();
    expect(prismaMock.marketplaceReview.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { published: true, hiddenAt: null, hiddenReason: null, hiddenById: null },
    }));
    expect(prismaMock.marketplaceProduct.update).toHaveBeenCalledTimes(2);
  });

  it("keeps review moderation to staff, and away from their own listings", async () => {
    const moderate = () => request(createApp()).post("/api/marketplace/moderation/reviews/review-1/visibility").set("Origin", "http://localhost:3000").set("Cookie", cookie).send({ action: "hide", reason: "Spam links" });

    signIn({ roles: ["CREATOR"] });
    expect((await moderate()).status).toBe(403);

    signIn({ id: "moderator-1", roles: ["MODERATOR"] });
    runTransaction();
    prismaMock.marketplaceReview.findUnique.mockResolvedValue({ id: "review-1", productId: "product-1", product: { creator: { ownerUserId: "moderator-1" } } });
    const own = await moderate();
    expect([own.status, own.body.error.code]).toEqual([403, "SELF_MODERATION_FORBIDDEN"]);
    expect(prismaMock.marketplaceReview.update).not.toHaveBeenCalled();
  });

  it("returns only public fields for reviews on a product page", async () => {
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({
      id: "product-1", slug: "owned-skill", name: "Owned", type: "Skill", itemType: "SKILL", rating: 4, priceMinor: 0, currency: "USD", pricingModel: "free",
      platforms: [], models: [], categoryId: "c", category: { name: "x", slug: "x" }, creatorId: "creator-1",
      creator: { id: "creator-1", name: "C", handle: "c", initials: "C", verified: true, bio: "", followers: 0, _count: { products: 1 } },
      versions: [], reviews: [],
    });
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);

    await request(createApp()).get("/api/marketplace/products/owned-skill");

    const include = prismaMock.marketplaceProduct.findFirst.mock.calls[0][0].include;
    expect(include.reviews.where).toEqual({ published: true });
    expect(Object.keys(include.reviews.select).sort()).toEqual(["author", "body", "createdAt", "id", "rating", "verifiedPurchase"]);
    expect(include.reviews.take).toBe(50);
  });
});
