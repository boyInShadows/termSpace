import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";

describe.skipIf(!databaseUrl)("changing a reader email on a real database", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let auth: typeof import("./middleware/auth.js");
  let worker: typeof import("./jobs/sendTransactionalEmails.js");
  const run = randomUUID().slice(0, 8);
  const password = "email-change-password";
  const userIds: string[] = [];

  async function reader(label: string, options: { password?: boolean } = {}) {
    const email = `${label}-${run}@email-change.test`;
    const user = await prisma.readerUser.create({
      data: { email, emailVerifiedAt: new Date(), passwordHash: options.password === false ? null : await hash(password, 4), googleSubject: options.password === false ? `google-${label}-${run}` : null },
    });
    userIds.push(user.id);
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: user.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    return { id: user.id, email, cookie: `${auth.READER_SESSION_COOKIE}=${token}` };
  }

  const as = (cookie: string) => ({
    get: (path: string) => request(app).get(path).set("Cookie", cookie).set("Origin", origin),
    post: (path: string, body: object = {}) => request(app).post(path).set("Cookie", cookie).set("Origin", origin).send(body),
  });
  const confirm = (token: string) => request(app).post("/api/readers/profile/email/confirm").set("Origin", origin).send({ token });
  const newAddress = (label: string) => `${label}-new-${run}@email-change.test`;

  /** Runs the mail worker and returns what it sent, so the link and the notice can be read like a real inbox. */
  async function inbox() {
    const sent: { to: string; text: string }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const message = JSON.parse(String(init?.body));
      sent.push({ to: message.to, text: message.text });
      return new Response(JSON.stringify({ result: { queued: [message.to] } }), { status: 200 });
    });
    await worker.processTransactionalEmailBatch(50);
    vi.restoreAllMocks();
    return sent;
  }
  const tokenFor = (sent: { to: string; text: string }[], to: string) => {
    const link = sent.find((message) => message.to === to)?.text.match(/http[^\s]+/)?.[0];
    expect(link, `a message to ${to}`).toBeDefined();
    expect(new URL(link!).pathname).toBe("/account/confirm-email");
    return new URLSearchParams(new URL(link!).hash.slice(1)).get("token")!;
  };

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    vi.stubEnv("WEB_PUBLIC_URL", origin);
    vi.stubEnv("EMAIL_VERIFICATION_SECRET", randomBytes(32).toString("hex"));
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account");
    vi.stubEnv("CLOUDFLARE_EMAIL_API_TOKEN", "test-token");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "accounts@email-change.test");
    ({ prisma } = await import("./lib/prisma.js"));
    auth = await import("./middleware/auth.js");
    worker = await import("./jobs/sendTransactionalEmails.js");
    app = (await import("./app.js")).createApp();
  });

  // Every request here comes from one address; the per-address limiter is not what these tests are about.
  beforeEach(async () => {
    const { emailChangeRequestRateLimit } = await import("./middleware/security.js");
    for (const key of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) await emailChangeRequestRateLimit.resetKey(key);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (prisma) {
      await prisma.readerUser.deleteMany({ where: { id: { in: userIds } } });
      await prisma.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  it("rejects an unauthenticated, wrong-password, unchanged or Google-only request", async () => {
    const member = await reader("rejects");
    const googleOnly = await reader("rejects-google", { password: false });
    expect((await request(app).post("/api/readers/profile/email").set("Origin", origin).send({ newEmail: newAddress("x"), currentPassword: password })).status).toBe(401);
    expect((await as(member.cookie).post("/api/readers/profile/email", { newEmail: newAddress("rejects"), currentPassword: "wrong-password" })).body.error.code).toBe("INVALID_CURRENT_PASSWORD");
    expect((await as(member.cookie).post("/api/readers/profile/email", { newEmail: member.email.toUpperCase(), currentPassword: password })).body.error.code).toBe("EMAIL_UNCHANGED");
    expect((await as(member.cookie).post("/api/readers/profile/email", { newEmail: "not-an-email", currentPassword: password })).status).toBe(400);
    expect((await as(googleOnly.cookie).post("/api/readers/profile/email", { newEmail: newAddress("rejects-google"), currentPassword: password })).body.error.code).toBe("EMAIL_CHANGE_REQUIRES_PASSWORD");
    expect(await prisma.readerEmailChange.count({ where: { userId: { in: [member.id, googleOnly.id] } } })).toBe(0);
  });

  it("looks the same for a taken address but sends nothing and creates nothing", async () => {
    const member = await reader("taken");
    const other = await reader("taken-other");
    const response = await as(member.cookie).post("/api/readers/profile/email", { newEmail: other.email, currentPassword: password });
    expect(response.status).toBe(202);
    expect(response.body).toEqual({ data: { accepted: true } });
    expect(await prisma.readerEmailChange.count({ where: { userId: member.id } })).toBe(0);
  });

  it("changes the email only after the link in the new inbox is opened, then signs out and notifies the old address", async () => {
    const member = await reader("flow");
    const target = newAddress("flow");
    const asked = await as(member.cookie).post("/api/readers/profile/email", { newEmail: target.toUpperCase(), currentPassword: password });
    expect(asked.status).toBe(202);
    expect((await prisma.readerUser.findUniqueOrThrow({ where: { id: member.id } })).email).toBe(member.email);

    const sent = await inbox();
    expect(sent.some((message) => message.to === member.email && /changed/i.test(message.text))).toBe(false);
    const token = tokenFor(sent, target);

    const confirmed = await confirm(token);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body).toEqual({ data: { changed: true } });
    const updated = await prisma.readerUser.findUniqueOrThrow({ where: { id: member.id } });
    expect(updated.email).toBe(target);
    expect(updated.emailVerifiedAt).toBeInstanceOf(Date);
    expect((await as(member.cookie).get("/api/readers/profile")).status).toBe(401);

    const login = await request(app).post("/api/readers/login").set("Origin", origin).send({ email: target, password });
    expect(login.status).toBe(200);
    expect((await request(app).post("/api/readers/login").set("Origin", origin).send({ email: member.email, password })).status).toBe(401);

    const notice = (await inbox()).find((message) => message.to === member.email);
    expect(notice?.text).toContain(target);
    expect(notice?.text).toMatch(/was changed/);
  });

  it("refuses a used, tampered, superseded or expired link", async () => {
    const member = await reader("links");
    const ask = (to: string) => as(member.cookie).post("/api/readers/profile/email", { newEmail: to, currentPassword: password });

    expect((await ask(newAddress("first"))).status).toBe(202);
    const first = tokenFor(await inbox(), newAddress("first"));
    // A newer request replaces the older link; backdate the cooldown so a second request is allowed.
    await prisma.readerEmailChange.updateMany({ where: { userId: member.id }, data: { createdAt: new Date(Date.now() - 120_000) } });
    expect((await ask(newAddress("second"))).status).toBe(202);
    expect((await confirm(first)).body.error.code).toBe("INVALID_OR_EXPIRED_EMAIL_CHANGE");

    const second = tokenFor(await inbox(), newAddress("second"));
    const tampered = `${second.slice(0, -2)}${second.endsWith("AA") ? "BB" : "AA"}`;
    expect((await confirm(tampered)).status).toBe(400);
    expect((await confirm(`unknown-id.${second.split(".")[1]}`)).status).toBe(400);
    expect((await confirm(second)).status).toBe(200);
    expect((await confirm(second)).body.error.code).toBe("INVALID_OR_EXPIRED_EMAIL_CHANGE");
  });

  it("rejects a link whose address was taken in the meantime and keeps the old email", async () => {
    const member = await reader("race");
    const target = newAddress("race");
    expect((await as(member.cookie).post("/api/readers/profile/email", { newEmail: target, currentPassword: password })).status).toBe(202);
    const token = tokenFor(await inbox(), target);
    const winner = await prisma.readerUser.create({ data: { email: target, emailVerifiedAt: new Date() } });
    userIds.push(winner.id);

    const response = await confirm(token);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_UNAVAILABLE");
    expect((await prisma.readerUser.findUniqueOrThrow({ where: { id: member.id } })).email).toBe(member.email);
    expect(await prisma.readerEmailChange.count({ where: { userId: member.id, consumedAt: null } })).toBe(1);
  });

  it("limits how fast one account can ask", async () => {
    const member = await reader("cooldown");
    expect((await as(member.cookie).post("/api/readers/profile/email", { newEmail: newAddress("cool-1"), currentPassword: password })).status).toBe(202);
    const again = await as(member.cookie).post("/api/readers/profile/email", { newEmail: newAddress("cool-2"), currentPassword: password });
    expect(again.status).toBe(429);
    expect(again.body.error.code).toBe("EMAIL_CHANGE_COOLDOWN");
  });
});
