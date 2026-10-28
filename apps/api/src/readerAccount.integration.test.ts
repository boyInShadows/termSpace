import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("reader account export and deletion on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let auth: typeof import("./middleware/auth.js");
  const run = randomUUID().slice(0, 8);
  const password = "account-test-password";
  const userIds: string[] = [];
  let productId = "";
  let creatorId = "";

  async function reader(label: string, options: { password?: boolean; googleSubject?: string } = {}) {
    const email = `${label}-${run}@account-delete.test`;
    const user = await prisma.readerUser.create({
      data: {
        email,
        emailVerifiedAt: new Date(),
        passwordHash: options.password === false ? null : await hash(password, 4),
        googleSubject: options.googleSubject ?? null,
      },
    });
    userIds.push(user.id);
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: user.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    const cookie = `${auth.READER_SESSION_COOKIE}=${token}`;
    return { id: user.id, email, cookie };
  }

  const asReader = (cookie: string) => ({
    get: (path: string) => request(app).get(path).set("Cookie", cookie).set("Origin", origin),
    delete: (path: string, body: object = {}) => request(app).delete(path).set("Cookie", cookie).set("Origin", origin).send(body),
  });

  async function review(userId: string, rating: number) {
    await prisma.marketplaceReview.create({ data: { userId, productId, author: "Reviewer", rating, body: `Rated ${rating}`, published: true, verifiedPurchase: true } });
  }

  async function rating() {
    const product = await prisma.marketplaceProduct.findUniqueOrThrow({ where: { id: productId }, select: { rating: true, reviewCount: true } });
    return { rating: Number(product.rating), reviewCount: product.reviewCount };
  }

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    ({ prisma } = await import("./lib/prisma.js"));
    auth = await import("./middleware/auth.js");
    app = (await import("./app.js")).createApp();

    const seller = await reader("seller");
    const creator = await prisma.marketplaceCreator.create({ data: { name: "Account Seller", handle: `seller-${run}`, initials: "AS", bio: "Sells things in tests", ownerUserId: seller.id } });
    creatorId = creator.id;
    const category = await prisma.marketplaceCategory.upsert({ where: { slug: "development" }, update: {}, create: { name: "Development", slug: "development" } });
    const product = await prisma.marketplaceProduct.create({
      data: {
        name: "Account Test Skill", slug: `account-skill-${run}`, type: "Skill", itemType: "SKILL", outcome: "Tests accounts", description: "Integration fixture",
        creatorId, categoryId: category.id, version: "1.0.0", platforms: [], models: [], tags: [], benefits: [], installationSteps: [], previewFiles: [],
      },
    });
    productId = product.id;
    // The lifecycle constraints only allow a published listing that has an approved snapshot.
    const snapshot = await prisma.marketplaceListingSnapshot.create({ data: { productId, revision: 1, schemaVersion: 0, digestSha256: "a".repeat(64), content: {}, createdByActor: "SYSTEM" } });
    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { approvedSnapshotId: snapshot.id, published: true, lifecycleState: "PUBLISHED" } });
    sellerCookie = seller.cookie;
  });

  let sellerCookie = "";

  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (prisma) {
      // Tombstones keep their audit rows, so tear the fixtures down in dependency order.
      try {
        await prisma.marketplaceReview.deleteMany({ where: { productId } });
        await prisma.marketplaceOrder.deleteMany({ where: { productId } });
        await prisma.marketplaceFavorite.deleteMany({ where: { productId } });
        await prisma.marketplaceProviderConnection.deleteMany({ where: { creatorId } });
        await prisma.marketplaceProduct.update({ where: { id: productId }, data: { approvedSnapshotId: null } });
        await prisma.marketplaceListingSnapshot.deleteMany({ where: { productId } });
        await prisma.marketplaceProduct.deleteMany({ where: { id: productId } });
        await prisma.marketplaceCreator.deleteMany({ where: { id: creatorId } });
        await prisma.readerUser.deleteMany({ where: { id: { in: userIds } } });
      } catch { /* a leftover fixture row never fails the suite */ }
      await prisma.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  it("exports only the caller's own data and never a secret", async () => {
    const buyer = await reader("export-buyer");
    const other = await reader("export-other");
    await prisma.marketplaceOrder.create({ data: { userId: buyer.id, productId, idempotencyKey: `export-${run}`, amountMinor: 0, currency: "USD", status: "completed" } });
    await prisma.marketplaceFavorite.create({ data: { userId: buyer.id, productId } });
    await review(buyer.id, 4);
    await review(other.id, 2);

    expect((await request(app).get("/api/readers/profile/export").set("Origin", origin)).status).toBe(401);
    const response = await asReader(buyer.cookie).get("/api/readers/profile/export");
    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.headers["cache-control"]).toBe("no-store");
    const data = response.body.data;
    expect(data.account).toMatchObject({ email: buyer.email, hasPassword: true, connectedGoogle: false, emailVerified: true });
    expect(data.acquisitions).toEqual([expect.objectContaining({ slug: `account-skill-${run}`, status: "completed" })]);
    expect(data.favorites).toHaveLength(1);
    expect(data.reviews).toEqual([expect.objectContaining({ rating: 4, body: "Rated 4" })]);
    const raw = JSON.stringify(response.body);
    for (const secret of ["passwordHash", "tokenHash", "googleSubject", "encryptedToken", other.email]) expect(raw).not.toContain(secret);
  });

  it("requires the current password and then anonymizes the account", async () => {
    const buyer = await reader("delete-buyer");
    const other = await reader("delete-other");
    await prisma.marketplaceOrder.create({ data: { userId: buyer.id, productId, idempotencyKey: `delete-${run}`, amountMinor: 0, currency: "USD", status: "completed" } });
    await prisma.marketplaceFavorite.create({ data: { userId: buyer.id, productId } });
    await prisma.marketplaceReview.deleteMany({ where: { productId } });
    await review(buyer.id, 5);
    await review(other.id, 1);
    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { rating: 3, reviewCount: 2 } });

    const client = asReader(buyer.cookie);
    expect((await client.delete("/api/readers/profile")).body.error.code).toBe("CURRENT_PASSWORD_REQUIRED");
    expect((await client.delete("/api/readers/profile", { currentPassword: "wrong-password" })).body.error.code).toBe("INVALID_CURRENT_PASSWORD");
    expect(await prisma.readerUser.count({ where: { id: buyer.id, deletedAt: null } })).toBe(1);

    const deleted = await client.delete("/api/readers/profile", { currentPassword: password });
    expect(deleted.status).toBe(204);
    expect(String(deleted.headers["set-cookie"])).toContain(`${auth.READER_SESSION_COOKIE}=;`);

    const tombstone = await prisma.readerUser.findUniqueOrThrow({ where: { id: buyer.id } });
    expect(tombstone).toMatchObject({ email: `deleted-${buyer.id}@deleted.invalid`, passwordHash: null, googleSubject: null, emailVerifiedAt: null });
    expect(tombstone.deletedAt).toBeInstanceOf(Date);
    expect(await prisma.readerSession.count({ where: { userId: buyer.id } })).toBe(0);
    expect(await prisma.marketplaceFavorite.count({ where: { userId: buyer.id } })).toBe(0);
    expect(await prisma.marketplaceReview.count({ where: { userId: buyer.id } })).toBe(0);
    expect(await prisma.marketplaceOrder.count({ where: { userId: buyer.id } })).toBe(1);
    expect(await rating()).toEqual({ rating: 1, reviewCount: 1 });

    expect((await client.get("/api/readers/profile")).status).toBe(401);
    const login = await request(app).post("/api/readers/login").set("Origin", origin).send({ email: buyer.email, password });
    expect(login.status).toBe(401);
  });

  it("recalculates the listing rating without the deleted review", async () => {
    await prisma.marketplaceReview.deleteMany({ where: { productId } });
    const leaver = await reader("rating-leaver");
    const stayer = await reader("rating-stayer");
    await review(leaver.id, 5);
    await review(stayer.id, 1);
    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { rating: 3, reviewCount: 2 } });

    expect((await asReader(leaver.cookie).delete("/api/readers/profile", { currentPassword: password })).status).toBe(204);
    expect(await rating()).toEqual({ rating: 1, reviewCount: 1 });
  });

  it("blocks a creator with live listings, then anonymizes the profile and scrubs credentials", async () => {
    const client = asReader(sellerCookie);
    await prisma.marketplaceProviderConnection.create({
      data: { creatorId, provider: "GITHUB", providerAccountId: "12345", accountLogin: "seller-login", encryptedToken: "ciphertext", tokenIv: "iv", tokenTag: "tag", lastVerifiedAt: new Date() },
    });

    const blocked = await client.delete("/api/readers/profile", { currentPassword: password });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("CREATOR_LISTINGS_ACTIVE");
    expect(await prisma.readerUser.count({ where: { deletedAt: null, marketplaceCreator: { id: creatorId } } })).toBe(1);

    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { lifecycleState: "ARCHIVED", published: false, lifecycleResumeState: "PUBLISHED", lifecycleResumePublished: true } });
    expect((await client.delete("/api/readers/profile", { currentPassword: password })).status).toBe(204);

    const creator = await prisma.marketplaceCreator.findUniqueOrThrow({ where: { id: creatorId } });
    expect(creator).toMatchObject({ name: "Deleted creator", handle: `deleted-${creatorId}`, bio: "", verified: false });
    const connection = await prisma.marketplaceProviderConnection.findFirstOrThrow({ where: { creatorId } });
    expect(connection).toMatchObject({ encryptedToken: "", tokenIv: "", tokenTag: "", accountLogin: "", providerAccountId: "" });
    expect(connection.revokedAt).toBeInstanceOf(Date);
  });

  it("asks a Google-only account for a fresh credential from the same Google identity", async () => {
    const subject = `google-${run}`;
    const member = await reader("google-only", { password: false, googleSubject: subject });
    const client = asReader(member.cookie);
    const verify = vi.spyOn(OAuth2Client.prototype, "verifyIdToken");

    expect((await client.delete("/api/readers/profile")).body.error.code).toBe("GOOGLE_CREDENTIAL_REQUIRED");

    verify.mockResolvedValueOnce({ getPayload: () => ({ sub: "someone-else", email_verified: true }) } as never);
    const mismatch = await client.delete("/api/readers/profile", { credential: "other-account-token" });
    expect(mismatch.status).toBe(401);
    expect(mismatch.body.error.code).toBe("INVALID_GOOGLE_CREDENTIAL");

    verify.mockRejectedValueOnce(new Error("bad token"));
    expect((await client.delete("/api/readers/profile", { credential: "bad-token" })).status).toBe(401);
    expect(await prisma.readerUser.count({ where: { id: member.id, deletedAt: null } })).toBe(1);

    verify.mockResolvedValueOnce({ getPayload: () => ({ sub: subject, email_verified: true }) } as never);
    expect((await client.delete("/api/readers/profile", { credential: "fresh-token" })).status).toBe(204);
    expect(await prisma.readerUser.findUniqueOrThrow({ where: { id: member.id } })).toMatchObject({ googleSubject: null, passwordHash: null });
  });
});
