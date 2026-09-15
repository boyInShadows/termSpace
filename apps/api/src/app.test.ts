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
  marketplaceProduct: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
  marketplaceCreator: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  marketplaceRoleGrant: { findUnique: vi.fn(), create: vi.fn() },
  marketplaceRoleEvent: { create: vi.fn() },
  marketplaceCategory: { findMany: vi.fn() },
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
