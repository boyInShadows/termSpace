import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("account onboarding persistence", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  const suffix = `${randomUUID()}@onboarding.test`;
  const password = "onboarding-test-password";
  const answers = { role: "developer", goal: "workflow", tools: ["codex", "cursor"], intent: "create" };
  const userIds: string[] = [];

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "true");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-client-id");
    ({ prisma } = await import("../lib/prisma.js"));
    app = (await import("../app.js")).createApp();
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (prisma) { await prisma.readerUser.deleteMany({ where: { OR: [{ email: { endsWith: suffix } }, { id: { in: userIds } }] } }); await prisma.$disconnect(); }
    vi.unstubAllEnvs();
  });

  it("onboards a new password account, isolates answers, exports them and erases them on deletion", async () => {
    const agent = request.agent(app);
    const email = `password-${suffix}`;
    const signup = await agent.post("/api/readers/register").set("Origin", origin).send({ email, password });
    expect(signup.status).toBe(202);
    expect(signup.headers["set-cookie"]).toBeUndefined();
    const login = await agent.post("/api/readers/login").set("Origin", origin).send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.onboardingRequired).toBe(true);
    const id = login.body.data.user.id as string;
    userIds.push(id);
    expect((await agent.get("/api/readers/onboarding")).body.data.required).toBe(true);
    const saved = await agent.put("/api/readers/onboarding").set("Origin", origin).send(answers);
    expect(saved.status).toBe(200);
    expect((await agent.get("/api/readers/onboarding")).body.data).toEqual({ ...answers, required: false });
    expect((await agent.post("/api/readers/login").set("Origin", origin).send({ email, password })).body.data.user.onboardingRequired).toBe(false);
    expect(await prisma.marketplaceRoleGrant.count({ where: { userId: id } })).toBe(0);
    const other = request.agent(app);
    await other.post("/api/readers/register").set("Origin", origin).send({ email: `other-${suffix}`, password });
    await other.post("/api/readers/login").set("Origin", origin).send({ email: `other-${suffix}`, password });
    expect((await other.get("/api/readers/onboarding")).body.data).toEqual({ required: true, role: null, goal: null, tools: [], intent: null });
    expect((await agent.get("/api/readers/profile/export").set("Origin", origin)).body.data.profileDetails).toEqual(answers);
    expect((await agent.delete("/api/readers/profile").set("Origin", origin).send({ currentPassword: password })).status).toBe(204);
    const tombstone = await prisma.readerUser.findUniqueOrThrow({ where: { id } });
    expect([tombstone.onboardingRole, tombstone.onboardingGoal, tombstone.onboardingIntent]).toEqual([null, null, null]);
    expect(tombstone.onboardingTools).toEqual([]);
    await prisma.readerUser.delete({ where: { id } });
  });

  it("returns the onboarding flag for a new Google account and stops returning it after completion", async () => {
    vi.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({ sub: `google-${suffix}`, email: `google-${suffix}`, email_verified: true }),
    } as never);
    const agent = request.agent(app);
    const body = { credential: "x".repeat(120) };
    const login = await agent.post("/api/readers/google").set("Origin", origin).send(body);
    expect(login.status).toBe(200);
    expect(login.body.data.user.onboardingRequired).toBe(true);
    expect((await agent.put("/api/readers/onboarding").set("Origin", origin).send({ ...answers, intent: "explore" })).status).toBe(200);
    expect((await agent.post("/api/readers/google").set("Origin", origin).send(body)).body.data.user.onboardingRequired).toBe(false);
  });
});
