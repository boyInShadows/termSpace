import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("reader authentication on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let emailWorker: typeof import("./jobs/sendTransactionalEmails.js");
  let tokens: typeof import("./lib/emailVerification.js");
  const suffix = `${randomUUID()}@auth-smoke.test`;
  const password = "original-test-password";

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    vi.stubEnv("WEB_PUBLIC_URL", origin);
    vi.stubEnv("EMAIL_VERIFICATION_SECRET", randomBytes(32).toString("hex"));
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account");
    vi.stubEnv("CLOUDFLARE_EMAIL_API_TOKEN", "test-token");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "accounts@auth-smoke.test");
    ({ prisma } = await import("./lib/prisma.js"));
    app = (await import("./app.js")).createApp();
    emailWorker = await import("./jobs/sendTransactionalEmails.js");
    tokens = await import("./lib/emailVerification.js");
  });

  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (prisma) {
      await prisma.readerUser.deleteMany({ where: { email: { endsWith: suffix } } });
      await prisma.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  async function register(label: string) {
    const email = `${label}-${suffix}`;
    const agent = request.agent(app);
    const response = await agent.post("/api/readers/register").set("Origin", origin).send({ email, password });
    expect(response.status).toBe(202);
    expect(response.headers["set-cookie"]).toBeUndefined();
    // Registering does not sign anyone in; the owner does that with the password they chose.
    const login = await agent.post("/api/readers/login").set("Origin", origin).send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.emailVerified).toBe(false);
    expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
    return { agent, email, id: login.body.data.user.id as string };
  }

  it("registers, sends verification, verifies once, logs in and logs out", async () => {
    const reader = await register("lifecycle");
    expect((await reader.agent.get("/api/readers/session")).body.data.user.email).toBe(reader.email);
    const duplicate = await request(app).post("/api/readers/register").send({ email: reader.email.toUpperCase(), password });
    expect(duplicate.status).toBe(202);
    expect(duplicate.body).toEqual({ data: { accepted: true } });
    expect(await prisma.readerUser.count({ where: { email: reader.email } })).toBe(1);
    const blocked = await reader.agent.post("/api/marketplace/creator/profile").set("Origin", origin)
      .send({ name: "Auth Tester", handle: `auth-${randomUUID().slice(0, 8)}`, bio: "Tests verified creator access." });
    expect(blocked.body.error.code).toBe("EMAIL_VERIFICATION_REQUIRED");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ result: { queued: [reader.email] } }), { status: 200 }));
    await emailWorker.processTransactionalEmailBatch();
    expect(fetchMock).toHaveBeenCalledOnce();
    const message = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const link = new URL(message.text.match(/http[^\s]+/)[0]);
    const token = new URLSearchParams(link.hash.slice(1)).get("token");
    expect(link.pathname).toBe("/account/verify-email");
    expect((await prisma.transactionalEmailOutbox.findFirst({ where: { verification: { userId: reader.id } } }))?.status).toBe("SENT");
    const confirmed = await reader.agent.post("/api/readers/email-verification/confirm").set("Origin", origin).send({ token });
    expect(confirmed.status).toBe(200);
    expect((await reader.agent.get("/api/readers/session")).body.data.user.emailVerified).toBe(true);
    expect((await request(app).post("/api/readers/email-verification/confirm").send({ token })).status).toBe(400);
    expect((await reader.agent.post("/api/readers/logout").set("Origin", origin)).status).toBe(204);
    expect((await reader.agent.get("/api/readers/session")).body.data.authenticated).toBe(false);
    expect((await reader.agent.post("/api/readers/login").set("Origin", origin).send({ email: reader.email, password: "incorrect-password" })).status).toBe(401);
    const login = await reader.agent.post("/api/readers/login").set("Origin", origin).send({ email: reader.email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.emailVerified).toBe(true);
  });

  it("throttles resends and replaces earlier verification links", async () => {
    const reader = await register("resend");
    const first = await prisma.readerEmailVerification.findFirstOrThrow({ where: { userId: reader.id } });
    const resend = () => reader.agent.post("/api/readers/email-verification/request").set("Origin", origin);
    expect((await resend()).status).toBe(202);
    expect(await prisma.readerEmailVerification.count({ where: { userId: reader.id } })).toBe(1);
    await prisma.readerEmailVerification.update({ where: { id: first.id }, data: { createdAt: new Date(Date.now() - 61_000) } });
    expect((await resend()).status).toBe(202);
    const replacement = await prisma.readerEmailVerification.findFirstOrThrow({ where: { userId: reader.id, consumedAt: null } });
    expect(replacement.id).not.toBe(first.id);
    expect((await prisma.transactionalEmailOutbox.findUniqueOrThrow({ where: { verificationId: first.id } })).status).toBe("CANCELLED");
    expect((await request(app).post("/api/readers/email-verification/confirm").send({ token: tokens.createEmailVerificationToken(first) })).status).toBe(400);
    expect((await request(app).post("/api/readers/email-verification/confirm").send({ token: tokens.createEmailVerificationToken(replacement) })).status).toBe(200);
  });

  it("sends a reset code, changes the password once, and revokes every session", async () => {
    const reader = await register("reset");
    const sendReset = () => request(app).post("/api/readers/password-reset/request").send({ email: reader.email });
    expect((await sendReset()).status).toBe(202);
    expect((await sendReset()).status).toBe(202);
    expect(await prisma.readerPasswordReset.count({ where: { userId: reader.id } })).toBe(1);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ result: { delivered: [body.to] } }), { status: 200 });
    });
    await emailWorker.processTransactionalEmailBatch();
    const message = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body))).find((body) => body.subject === "Reset your TermSpace password");
    expect(message.to).toBe(reader.email);
    const payload = { email: reader.email, code: message.text.match(/\b\d{6}\b/)[0], newPassword: "replacement-test-password" };
    expect((await request(app).post("/api/readers/password-reset/confirm").send(payload)).status).toBe(200);
    expect((await reader.agent.get("/api/readers/session")).body.data.authenticated).toBe(false);
    expect((await request(app).post("/api/readers/password-reset/confirm").send(payload)).status).toBe(400);
    expect((await request(app).post("/api/readers/login").send({ email: reader.email, password })).status).toBe(401);
    const login = await request(app).post("/api/readers/login").send({ email: reader.email, password: payload.newPassword });
    expect(login.status).toBe(200);
    expect(login.body.data.user.emailVerified).toBe(true);
  });

  it("locks a reset code after five wrong attempts and rejects expired links", async () => {
    const reader = await register("limits");
    await request(app).post("/api/readers/password-reset/request").send({ email: reader.email }).expect(202);
    const reset = await prisma.readerPasswordReset.findFirstOrThrow({ where: { userId: reader.id } });
    const code = tokens.createPasswordResetCode(reset);
    const wrongCode = code === "000000" ? "000001" : "000000";
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app).post("/api/readers/password-reset/confirm").send({ email: reader.email, code: wrongCode, newPassword: "replacement-password" }).expect(400);
    }
    const locked = await prisma.readerPasswordReset.findUniqueOrThrow({ where: { id: reset.id } });
    expect(locked.failedAttempts).toBe(5);
    expect(locked.consumedAt).not.toBeNull();
    await request(app).post("/api/readers/password-reset/confirm").send({ email: reader.email, code, newPassword: "replacement-password" }).expect(400);
    const verification = await prisma.readerEmailVerification.findFirstOrThrow({ where: { userId: reader.id } });
    verification.expiresAt = new Date(Date.now() - 1_000);
    await prisma.readerEmailVerification.update({ where: { id: verification.id }, data: { expiresAt: verification.expiresAt } });
    await request(app).post("/api/readers/email-verification/confirm").send({ token: tokens.createEmailVerificationToken(verification) }).expect(400);
    expect((await prisma.readerUser.findUniqueOrThrow({ where: { id: reader.id } })).emailVerifiedAt).toBeNull();
  });
});
