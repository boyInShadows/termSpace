import { createHash } from "node:crypto";
import request from "supertest";
import { afterAll, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

// Run only against the disposable database created by the migration verification script.
const enabled = Boolean(process.env.MARKETPLACE_TEST_DATABASE_URL);
const db = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.MARKETPLACE_TEST_DATABASE_URL ?? process.env.DATABASE_URL,
    },
  },
});
afterAll(() => db.$disconnect());

it.skipIf(!enabled)(
  "publishes community discovery and enforces independent, reversible trust decisions",
  async () => {
    const testUrl = new URL(process.env.MARKETPLACE_TEST_DATABASE_URL!);
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(testUrl.hostname) ||
      !testUrl.pathname.startsWith("/termspace_batch_")
    )
      throw new Error(
        "Integration tests require a disposable local batch database",
      );
    process.env.DATABASE_URL = process.env.MARKETPLACE_TEST_DATABASE_URL;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "false";
    process.env.NODE_ENV = "test";
    const { createApp } = await import("./app.js");
    const app = createApp();
    const category = await db.marketplaceCategory.create({
      data: { name: "Developer tools", slug: "developer-tools" },
    });
    const users: Record<string, string> = {};
    const cookies: Record<string, string> = {};
    for (const [name, roles] of Object.entries({
      creator: ["CREATOR"],
      moderator: ["MODERATOR"],
      reviewer: ["MODERATOR"],
      administrator: ["ADMINISTRATOR"],
      reader: [],
    })) {
      const user = await db.readerUser.create({
        data: {
          email: `${name}@batch.test`,
          emailVerifiedAt: new Date(),
          marketplaceRoleGrants: {
            create: roles.map((role) => ({
              role: role as "CREATOR" | "MODERATOR" | "ADMINISTRATOR",
            })),
          },
        },
      });
      users[name] = user.id;
      const token = name.padEnd(40, "x");
      cookies[name] = `term_academy_reader=${token}`;
      await db.readerSession.create({
        data: {
          userId: user.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    }
    const creator = await db.marketplaceCreator.create({
      data: {
        ownerUserId: users.creator,
        name: "Test Creator",
        handle: "test-creator",
        initials: "TC",
        bio: "A creator testing community publishing.",
      },
    });
    const communityBody = {
      nameEn: "Codex community",
      nameFa: "جامعه کدکس",
      descriptionEn: "An independent testing community.",
      descriptionFa: null,
      primaryPlatform: "Codex",
      rulesEn: "Only relevant and reviewed resources.",
      rulesFa: null,
      submissionGuidanceEn: "Request placement with a reviewed listing.",
      submissionGuidanceFa: null,
      state: "ACTIVE",
      accentColor: "#0f766e",
    };
    const call = (name: string, path: string, body: object) =>
      request(app)
        .post(`/api/marketplace/${path}`)
        .set("Origin", "http://localhost:3000")
        .set("Cookie", cookies[name])
        .send(body);
    expect(
      (
        await request(app)
          .put("/api/marketplace/moderation/communities/codex")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.creator)
          .send(communityBody)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put("/api/marketplace/moderation/communities/codex")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.administrator)
          .send(communityBody)
      ).status,
    ).toBe(200);
    const manifest = {
      manifestVersion: 1,
      type: "skill",
      listing: {
        slug: "batch-skill",
        name: { en: "Batch Skill" },
        outcome: { en: "Completes a useful task" },
        description: { en: "A reviewed community skill for testing." },
        categorySlug: category.slug,
        communitySlugs: ["codex"],
        tags: ["testing"],
        screenshots: [],
      },
      release: {
        version: "1.0.0",
        source: {
          kind: "github_repository",
          repositoryUrl: "https://github.com/example/skill",
          commitSha: "a".repeat(40),
        },
        releaseNotes: "Initial release",
        compatibility: [{ platform: "Codex", models: ["GPT-5"] }],
        installation: { method: "manual", instructions: ["Copy the files"] },
        requirements: {
          runtimes: [],
          accounts: [],
          operatingSystems: [],
          dependencies: [],
          environmentVariables: [],
        },
        permissions: [],
        license: { identifier: "MIT" },
      },
      typeDetails: {
        format: "SKILL.md",
        entryPath: "SKILL.md",
        activation: "Install in your skills directory",
        bundledExecutables: false,
        inputs: [],
        outputs: [],
      },
    };
    const created = await call("creator", "creator/products", { manifest });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const productId = created.body.data.id as string;
    let product = await db.marketplaceProduct.findUniqueOrThrow({
      where: { id: productId },
      include: { proposedSnapshot: true },
    });
    const releaseId = product.proposedSnapshot!.releaseManifestId!;
    const lifecycle = async (name: string, action: string) => {
      const current = await db.marketplaceProduct.findUniqueOrThrow({
        where: { id: productId },
      });
      return call(
        name,
        `${name === "creator" ? "creator" : "moderation"}/products/${productId}/lifecycle`,
        { action, expectedVersion: current.lifecycleVersion },
      );
    };
    expect((await lifecycle("creator", "SUBMIT")).status).toBe(409);
    await db.marketplaceReleaseManifest.update({
      where: { id: releaseId },
      data: {
        sourceCheckStatus: "VERIFIED",
        sourceResolvedAt: new Date(),
        ownershipVerifiedAt: new Date(),
        resolvedInstallationUrl: `https://github.com/example/skill/tree/${"a".repeat(40)}`,
      },
    });
    expect((await lifecycle("creator", "SUBMIT")).status).toBe(200);
    const placement = await db.marketplaceCommunityPlacement.findFirstOrThrow({
      where: { productId },
    });
    const placementDecision = {
      expectedVersion: placement.version,
      state: "APPROVED",
      publicReason: "Compatible with Codex and relevant to the community.",
    };
    await db.marketplaceRoleGrant.create({
      data: { userId: users.creator, role: "MODERATOR" },
    });
    expect(
      (
        await call(
          "creator",
          `moderation/placements/${placement.id}`,
          placementDecision,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call(
          "moderator",
          `moderation/placements/${placement.id}`,
          placementDecision,
        )
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/marketplace/products?community=codex")).body
        .data,
    ).toHaveLength(0);
    expect((await lifecycle("moderator", "APPROVE")).status).toBe(200);
    expect((await lifecycle("moderator", "PUBLISH")).status).toBe(200);
    const browse = await request(app).get(
      "/api/marketplace/products?community=codex&platform=Codex&model=GPT-5&q=codex",
    );
    expect(browse.status, JSON.stringify(browse.body)).toBe(200);
    expect(browse.body.data).toHaveLength(1);
    expect(browse.body.data[0].compatibility.platforms).toEqual(["codex"]);
    expect(browse.body.data[0].compatibility.models).toEqual(["gpt-5"]);
    expect(browse.body.data[0].communities).toEqual([
      expect.objectContaining({ slug: "codex" }),
    ]);
    expect(browse.body.data[0].creator).not.toHaveProperty("ownerUserId");
    expect(
      (await request(app).get("/api/marketplace/products?platform=unknown"))
        .status,
    ).toBe(400);
    expect(
      (await request(app).get("/api/marketplace/creators/test-creator")).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .put("/api/marketplace/creator/collections/favorites")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.creator)
          .send({
            title: "Favorites",
            description: "A useful collection",
            published: true,
            productIds: [productId],
          })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app).get(
          "/api/marketplace/creators/test-creator/collections/favorites",
        )
      ).body.data.items,
    ).toHaveLength(1);
    const acquired = await request(app)
      .post("/api/marketplace/products/batch-skill/acquire")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", cookies.reader)
      .set("Idempotency-Key", "batch-acquisition-1")
      .send({});
    expect(acquired.status, JSON.stringify(acquired.body)).toBe(201);
    const reportBody = {
      targetType: "RELEASE",
      targetId: releaseId,
      reason: "MALICIOUS",
      explanation: "Suspicious behavior requires investigation.",
    };
    expect((await call("reader", "reports", reportBody)).status).toBe(201);
    expect((await call("reader", "reports", reportBody)).status).toBe(409);
    const caseRecord = await db.marketplaceTrustCase.findFirstOrThrow({
      where: { releaseId },
    });
    const decision = await call(
      "moderator",
      `moderation/cases/${caseRecord.id}`,
      {
        expectedVersion: 0,
        action: "RESTRICT",
        severity: "CRITICAL",
        publicReason: "Installation held while the release is investigated.",
        internalNote: "Private investigation details",
      },
    );
    expect(decision.status, JSON.stringify(decision.body)).toBe(200);
    expect(
      (await request(app).get("/api/marketplace/products?community=codex")).body
        .data,
    ).toHaveLength(1);
    expect(
      (
        await request(app)
          .get("/api/marketplace/products/batch-skill/installation")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .get("/api/marketplace/library")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).body.data[0].installationAvailable,
    ).toBe(false);
    const ownedCases = await request(app)
      .get("/api/marketplace/cases")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", cookies.creator);
    expect(JSON.stringify(ownedCases.body)).not.toContain(
      "Private investigation details",
    );
    expect(ownedCases.body.data[0]).not.toHaveProperty("reports");
    const decisionEventId = decision.body.data.restrictions[0].decisionEventId;
    const appeal = await call("creator", `cases/${caseRecord.id}/appeals`, {
      decisionEventId,
      explanation: "The behavior was misunderstood.",
      evidence: "A new source verification supports this appeal.",
    });
    expect(appeal.status).toBe(201);
    const reversal = {
      expectedVersion: 1,
      outcome: "REVERSED",
      publicReason: "Checks passed and the release can be reinstated.",
    };
    expect(
      (
        await call(
          "moderator",
          `moderation/appeals/${appeal.body.data.id}`,
          reversal,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call(
          "reviewer",
          `moderation/appeals/${appeal.body.data.id}`,
          reversal,
        )
      ).status,
    ).toBe(409);
    await db.marketplaceReleaseManifest.update({
      where: { id: releaseId },
      data: {
        sourceCheckStatus: "VERIFIED",
        sourceCheckedAt: new Date(),
        ownershipVerifiedAt: new Date(),
      },
    });
    await expect(
      db.marketplaceReleaseManifest.update({
        where: { id: releaseId },
        data: { releaseNotes: "Changed published contents" },
      }),
    ).rejects.toThrow();
    expect(
      (
        await call(
          "reviewer",
          `moderation/appeals/${appeal.body.data.id}`,
          reversal,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/marketplace/products/batch-skill/installation")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).status,
    ).toBe(200);
    const restriction = await db.marketplaceRestriction.findFirstOrThrow({
      where: { caseId: caseRecord.id },
    });
    await expect(
      db.marketplaceRestriction.update({
        where: { id: restriction.id },
        data: { revokedAt: null },
      }),
    ).rejects.toThrow();
    await expect(
      db.marketplaceTrustEvent.delete({ where: { id: decisionEventId } }),
    ).rejects.toThrow();
    await expect(
      db.marketplaceAppeal.update({
        where: { id: appeal.body.data.id },
        data: { evidence: "Changed original evidence" },
      }),
    ).rejects.toThrow();
    // An edit cannot replace the approved public placement before publication.
    manifest.listing.name.en = "Revised Skill";
    const updated = await request(app)
      .put(`/api/marketplace/creator/products/${productId}/draft`)
      .set("Origin", "http://localhost:3000")
      .set("Cookie", cookies.creator)
      .send({
        expectedVersion: (
          await db.marketplaceProduct.findUniqueOrThrow({
            where: { id: productId },
          })
        ).lifecycleVersion,
        manifest,
      });
    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect((await lifecycle("creator", "SUBMIT")).status).toBe(200);
    expect(
      (await request(app).get("/api/marketplace/products?community=codex")).body
        .data[0].name,
    ).toBe("Batch Skill");
    // Placement removal affects only that community, and collection visibility follows listing restrictions.
    const placementNow =
      await db.marketplaceCommunityPlacement.findUniqueOrThrow({
        where: { id: placement.id },
      });
    expect(
      (
        await call("moderator", `moderation/placements/${placement.id}`, {
          ...placementDecision,
          expectedVersion: placementNow.version,
          state: "REMOVED",
        })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/marketplace/products?community=codex")).body
        .data,
    ).toHaveLength(0);
    expect(
      (await request(app).get("/api/marketplace/products/batch-skill")).status,
    ).toBe(200);
    expect(
      (
        await call("reader", "reports", {
          ...reportBody,
          targetType: "PRODUCT",
          targetId: productId,
        })
      ).status,
    ).toBe(201);
    const productCase = await db.marketplaceTrustCase.findFirstOrThrow({
      where: { productId },
    });
    expect(
      (
        await call("moderator", `moderation/cases/${productCase.id}`, {
          expectedVersion: 0,
          action: "RESTRICT",
          severity: "HIGH",
          publicReason: "Listing hidden while staff investigates.",
        })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/marketplace/products/batch-skill")).status,
    ).toBe(404);
    expect(
      (
        await request(app).get(
          "/api/marketplace/creators/test-creator/collections/favorites",
        )
      ).body.data.items,
    ).toHaveLength(0);
    const accountCase = await call(
      "administrator",
      "moderation/account-cases",
      {
        userId: users.reader,
        publicReason: "Account abuse requires a marketplace investigation.",
      },
    );
    expect(accountCase.status).toBe(201);
    expect(
      (
        await call(
          "administrator",
          `moderation/cases/${accountCase.body.data.id}`,
          {
            expectedVersion: 0,
            action: "RESTRICT",
            severity: "HIGH",
            publicReason:
              "Marketplace privileges suspended during investigation.",
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/marketplace/library")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get("/api/marketplace/cases")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/readers/session")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.reader)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/articles")
          .set("Origin", "http://localhost:3000")
          .set("Cookie", cookies.administrator)
      ).status,
    ).toBe(401);
    await db.marketplaceCommunity.update({
      where: { slug: "codex" },
      data: { state: "ARCHIVED" },
    });
    expect(
      (await request(app).get("/api/marketplace/communities/codex")).body.data
        .state,
    ).toBe("ARCHIVED");
    expect(
      (
        await request(app).get("/api/marketplace/discovery-options")
      ).body.data.communities.some(
        (entry: { slug: string }) => entry.slug === "codex",
      ),
    ).toBe(false);
    expect(creator.ownerUserId).toBe(users.creator);
  },
  60000,
);
