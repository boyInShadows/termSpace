import { hash } from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyGoogleIdToken = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  adminSession: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  article: { findUnique: vi.fn(), updateMany: vi.fn() },
  readerUser: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  readerSession: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  readerEmailVerification: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  transactionalEmailOutbox: { updateMany: vi.fn() },
  marketplaceProduct: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceProductVersion: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceReleaseManifest: { create: vi.fn(), update: vi.fn() },
  marketplaceSkillReleaseDetails: { create: vi.fn() },
  marketplaceListingSnapshot: { aggregate: vi.fn(), create: vi.fn() },
  marketplaceManifestSnapshot: { create: vi.fn() },
  marketplaceCommunity: { findMany: vi.fn() },
  marketplaceCommunityPlacementRequest: { createMany: vi.fn() },
  marketplaceListingLifecycleEvent: { create: vi.fn(), findMany: vi.fn() },
  marketplaceOrder: { count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  marketplaceCreator: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceRoleGrant: { findUnique: vi.fn(), create: vi.fn() },
  marketplaceRoleEvent: { create: vi.fn() },
  marketplaceCategory: { findMany: vi.fn(), findUnique: vi.fn() },
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
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
const { createApp } = await import("./app.js");
const { createEmailVerificationToken } = await import("./lib/emailVerification.js");

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
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    prismaMock.article.updateMany.mockResolvedValue({ count: 0 });
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

  it("serves marketplace home data from the shared API", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(12);
    prismaMock.marketplaceCreator.findMany.mockResolvedValue([]);
    prismaMock.marketplaceCategory.findMany.mockResolvedValue([]);
    const response = await request(createApp()).get("/api/marketplace/home");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ products: [], creators: [], categories: [], total: 12 });
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

    const response = await request(createApp()).get("/api/marketplace/home");
    expect(response.status).toBe(200);
    expect(response.body.data.products[0]).toEqual(expect.objectContaining({ type: "Skill", typeKey: "skill" }));
    expect(response.body.data.products[0]).not.toHaveProperty("itemType");
    expect(response.body.data.products[0]).not.toHaveProperty("classificationRequired");
    expect(response.body.data.products[0]).not.toHaveProperty("lifecycleState");
    expect(response.body.data.products[0]).not.toHaveProperty("approvedSnapshotId");
  });

  it("filters by canonical item type while preserving legacy filters", async () => {
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([]);
    prismaMock.marketplaceProduct.count.mockResolvedValue(0);

    expect((await request(createApp()).get("/api/marketplace/products?type=prompt")).status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ itemType: "PROMPT" }),
    }));

    expect((await request(createApp()).get("/api/marketplace/products?type=Prompt%20pack")).status).toBe(200);
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ type: "Prompt pack" }),
    }));
  });

  it("does not expose draft-only versions on a public product page", async () => {
    prismaMock.marketplaceProduct.findFirst.mockResolvedValue({
      id: "product-1", slug: "published-skill", name: "Published Skill", type: "Skill", itemType: "SKILL",
      rating: 0, priceMinor: 0, currency: "USD", pricingModel: "free", platforms: ["Codex"], models: [],
      categoryId: "category-1", category: { name: "Developer tools", slug: "developer-tools" },
      creatorId: "creator-1", creator: { id: "creator-1", name: "Creator", handle: "creator", initials: "CR", verified: true, bio: "Creator biography", followers: 0, _count: { products: 1 } },
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
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } },
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
        releaseManifest: { id: "release-1", publishedAt: null, sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() },
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
      proposedSnapshot: { content: marketplaceManifestFixture(), schemaVersion: 1, releaseManifest: { id: "pending-release", publishedAt: null, sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } },
      approvedSnapshot: { schemaVersion: 1, releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } },
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
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } },
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
    prismaMock.marketplaceProduct.findMany.mockResolvedValue([{
      id: "product-1", slug: "owned-skill", name: "Owned Skill", itemType: "SKILL", type: "Skill",
      lifecycleState: "CHANGES_REQUESTED", lifecycleVersion: 3, published: false,
      rating: 4.5, reviewCount: 2, version: "1.1.0", updatedAt: new Date("2026-09-16T10:00:00.000Z"),
      versions: [{ version: "1.1.0", releasedAt: new Date("2026-09-15T10:00:00.000Z") }],
      lifecycleEvents: [{ id: "event-2", action: "CHANGES_REQUESTED", resultingState: "CHANGES_REQUESTED", publicReason: "Clarify network access.", createdAt: new Date("2026-09-16T09:00:00.000Z") }],
      _count: { versions: 2, orders: 7 },
    }]);
    prismaMock.marketplaceProduct.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prismaMock.marketplaceOrder.count.mockResolvedValue(7);
    prismaMock.marketplaceListingLifecycleEvent.findMany.mockResolvedValue([{
      productId: "product-1", action: "CHANGES_REQUESTED", reasonCode: "PERMISSIONS_UNCLEAR",
      publicReason: "Clarify network access.", createdAt: new Date("2026-09-16T09:00:00.000Z"),
    }]);

    const response = await request(createApp())
      .get("/api/marketplace/creator/dashboard?page=1&limit=12")
      .set("Cookie", "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456");

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual({ totalListings: 1, publishedListings: 0, inReviewListings: 0, totalAcquisitions: 7 });
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
        releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: null, productVersion: { version: "1.1.0" } },
      },
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
    });
    expect(prismaMock.marketplaceProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { lifecycleState: { in: ["SUBMITTED", "APPROVED"] }, NOT: { creator: { ownerUserId: "moderator-1" } } }, skip: 0, take: 24,
    }));
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
    expect(prismaMock.marketplaceCommunityPlacementRequest.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ snapshotId: "snapshot-1", communityId: "community-1", productId: "product-1", requestedByUserId: "reader-1" })] });
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
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } }, approvedSnapshot: null,
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
      proposedSnapshot: { releaseManifest: { sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date() } },
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
