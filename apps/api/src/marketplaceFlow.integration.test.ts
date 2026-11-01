import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The core marketplace journey against a real, migrated Postgres.
 *
 * Every other API test mocks Prisma, which accepts any arguments; a nested
 * `create` carrying `deleteMany` broke draft creation for weeks without one
 * failing. Set INTEGRATION_DATABASE_URL to a disposable database (CI does) to run it.
 */
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("marketplace journey on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  const run = randomUUID().slice(0, 8);
  const slug = `smoke-skill-${run}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.CORS_ORIGINS = origin;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = origin;
    ({ prisma } = await import("./lib/prisma.js"));
    app = (await import("./app.js")).createApp();
    // Categories come from the seed, not migrations; platforms and communities do.
    await prisma.marketplaceCategory.upsert({ where: { slug: "development" }, update: {}, create: { slug: "development", name: "Development" } });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function reader(label: string) {
    const agent = request.agent(app);
    const credentials = { email: `${label}-${run}@smoke.test`, password: `${label}-smoke-password-${run}` };
    expect((await agent.post("/api/readers/register").set("Origin", origin).send(credentials)).status).toBe(202);
    const login = await agent.post("/api/readers/login").set("Origin", origin).send(credentials);
    expect(login.status).toBe(200);
    return { agent, userId: login.body.data.user.id as string };
  }

  it("takes a listing from draft to a reviewed acquisition", async () => {
    const creator = await reader("creator");
    expect((await creator.agent.post("/api/marketplace/creator/profile").set("Origin", origin)
      .send({ name: "Smoke Creator", handle: `smoke-${run}`, bio: "Builds listings for the smoke test." })).status).toBe(201);

    const draft = await creator.agent.post("/api/marketplace/creator/products").set("Origin", origin).send({ manifest: {
      manifestVersion: 1,
      type: "skill",
      listing: {
        slug, name: { en: "Smoke Skill" }, outcome: { en: "Proves the marketplace journey" },
        description: { en: "Created by the real-database smoke test." }, categorySlug: "development",
        communitySlugs: ["codex"], tags: ["smoke"], screenshots: [],
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
    } });
    expect(draft.status).toBe(201);
    const productId = draft.body.data.id as string;

    // Stands in for the source worker, which needs a real GitHub token and repository.
    await prisma.marketplaceReleaseManifest.updateMany({
      where: { productVersion: { productId } },
      data: { sourceCheckStatus: "VERIFIED", sourceResolvedAt: new Date(), ownershipVerifiedAt: new Date(), sourceCheckedAt: new Date(), resolvedInstallationUrl: "https://github.com/example/item" },
    });
    expect((await creator.agent.post(`/api/marketplace/creator/products/${productId}/lifecycle`).set("Origin", origin)
      .send({ expectedVersion: 1, action: "SUBMIT" })).status).toBe(200);

    const moderator = await reader("moderator");
    await prisma.marketplaceRoleGrant.create({ data: { userId: moderator.userId, role: "MODERATOR" } });
    for (const [expectedVersion, action] of [[2, "APPROVE"], [3, "PUBLISH"]] as const) {
      const transition = await moderator.agent.post(`/api/marketplace/moderation/products/${productId}/lifecycle`).set("Origin", origin)
        .send({ expectedVersion, action });
      expect(transition.status).toBe(200);
    }

    const buyer = await reader("buyer");
    const key = `smoke-acquire-${run}-0000`;
    const first = await buyer.agent.post(`/api/marketplace/products/${slug}/acquire`).set("Origin", origin).set("Idempotency-Key", key);
    const retry = await buyer.agent.post(`/api/marketplace/products/${slug}/acquire`).set("Origin", origin).set("Idempotency-Key", key);
    expect(first.status).toBe(201);
    expect(retry.body.data.id).toBe(first.body.data.id);
    expect((await buyer.agent.get(`/api/marketplace/products/${slug}/installation`)).status).toBe(200);

    expect((await buyer.agent.put(`/api/marketplace/products/${slug}/reviews`).set("Origin", origin)
      .send({ rating: 4, displayName: "Smoke Buyer", body: "Installed cleanly on the first try." })).status).toBe(201);
    const product = await request(app).get(`/api/marketplace/products/${slug}`);
    expect(product.body.data).toMatchObject({ rating: 4, reviewCount: 1, published: true });
  });

  it("takes a plain link listing from draft to acquisition without any provider token", async () => {
    const linkSlug = `${slug}-link`;
    const url = "https://example.com/shared-project";
    const creator = await reader("linker");
    expect((await creator.agent.post("/api/marketplace/creator/profile").set("Origin", origin)
      .send({ name: "Link Creator", handle: `link-${run}`, bio: "Shares useful projects for the smoke test." })).status).toBe(201);
    const draft = await creator.agent.post("/api/marketplace/creator/products").set("Origin", origin).send({ manifest: {
      manifestVersion: 1,
      type: "skill",
      listing: { slug: linkSlug, name: { en: "Shared Skill" }, outcome: { en: "Proves the link journey" }, description: { en: "Shared by the smoke test." }, categorySlug: "development", communitySlugs: [], tags: [], screenshots: [] },
      release: {
        version: "1.0.0",
        source: { kind: "external_link", url, authorship: "third_party", originalAuthor: "A. Author" },
        releaseNotes: "Initial release",
        compatibility: [{ platform: "claude-code", models: [] }],
        installation: { method: "manual", instructions: ["Follow the project's install guide"] },
        requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [], environmentVariables: [] },
        permissions: [],
        license: { identifier: "MIT" },
      },
      typeDetails: { format: "SKILL.md", entryPath: "SKILL.md", activation: "Install in the skills directory", bundledExecutables: false, inputs: [], outputs: [] },
    } });
    expect(draft.status).toBe(201);
    const productId = draft.body.data.id as string;

    const check = await creator.agent.post(`/api/marketplace/creator/products/${productId}/source-check`).set("Origin", origin).send({ expectedVersion: 1 });
    expect(check.body.error.code).toBe("SOURCE_CHECK_NOT_APPLICABLE");
    expect((await creator.agent.post(`/api/marketplace/creator/products/${productId}/lifecycle`).set("Origin", origin)
      .send({ expectedVersion: 1, action: "SUBMIT" })).status).toBe(200);

    const release = await prisma.marketplaceReleaseManifest.findFirstOrThrow({ where: { productVersion: { productId } } });
    expect(release).toMatchObject({ sourceCheckStatus: "LINK_ONLY", ownershipVerifiedAt: null, sourceOriginalAuthor: "A. Author" });

    const moderator = await reader("linkmod");
    await prisma.marketplaceRoleGrant.create({ data: { userId: moderator.userId, role: "MODERATOR" } });
    for (const [expectedVersion, action] of [[2, "APPROVE"], [3, "PUBLISH"]] as const) {
      expect((await moderator.agent.post(`/api/marketplace/moderation/products/${productId}/lifecycle`).set("Origin", origin)
        .send({ expectedVersion, action })).status).toBe(200);
    }

    const product = await request(app).get(`/api/marketplace/products/${linkSlug}`);
    expect(product.body.data.release.source).toMatchObject({ kind: "external_link", status: "link_only", url, originalAuthor: "A. Author" });
    const buyer = await reader("linkbuyer");
    expect((await buyer.agent.post(`/api/marketplace/products/${linkSlug}/acquire`).set("Origin", origin).set("Idempotency-Key", `link-acquire-${run}-0000`)).status).toBe(201);
    expect((await buyer.agent.get(`/api/marketplace/products/${linkSlug}/installation`)).status).toBe(200);
  });
});
