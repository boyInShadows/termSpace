import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hash } from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";
const password = "support-test-password";
type Reader = { id: string; cookie: string };

describe.skipIf(!databaseUrl)("private support on disposable PostgreSQL", () => {
  let app: import("express").Express;
  let prisma: import("@prisma/client").PrismaClient;
  let auth: typeof import("../middleware/auth.js");
  let member: Reader, other: Reader, moderator: Reader, administrator: Reader;
  const userIds: string[] = [];
  const run = randomUUID();
  const privateDirectory = new URL("../../private/support/", import.meta.url);
  async function reader(label: string, role?: "MODERATOR" | "ADMINISTRATOR") {
    const user = await prisma.readerUser.create({ data: {
      email: `${label}-${run}@support.test`, passwordHash: await hash(password, 4),
      emailVerifiedAt: role ? new Date() : null,
      ...(role && { marketplaceRoleGrants: { create: { role } } }),
    } });
    userIds.push(user.id);
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: user.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    return { id: user.id, cookie: `${auth.READER_SESSION_COOKIE}=${token}` };
  }
  const get = (who: Reader, path = "") => request(app).get(`/api/support${path}`).set("Cookie", who.cookie);
  const post = (who: Reader, path: string, body: object) => request(app).post(`/api/support${path}`).set("Cookie", who.cookie).set("Origin", origin).send(body);
  async function ticket(who = member, subject = "A private question") {
    const response = await post(who, "", { category: "TECHNICAL", subject, message: "First message\nwith details" });
    expect(response.status).toBe(201);
    return response.body.data as { id: string; version: number; status: string };
  }
  beforeAll(async () => {
    const target = new URL(databaseUrl!);
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/^\/termspace_support_test_[a-z0-9_]+$/.test(target.pathname)) throw new Error("Support tests require a disposable local database");
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    ({ prisma } = await import("../lib/prisma.js"));
    auth = await import("../middleware/auth.js");
    app = (await import("../app.js")).createApp();
    member = await reader("unverified"); other = await reader("other");
    moderator = await reader("moderator", "MODERATOR"); administrator = await reader("administrator", "ADMINISTRATOR");
  });
  afterAll(async () => {
    if (prisma) { await prisma.readerUser.deleteMany({ where: { id: { in: userIds } } }); await prisma.$disconnect(); }
    vi.unstubAllEnvs();
  });

  it("permits unverified owners, isolates list/count/search/detail/mutations and hides email", async () => {
    const saved = await ticket();
    expect((await get(member)).headers["cache-control"]).toBe("no-store");
    const foreign = await get(other, `/${saved.id}`);
    expect(foreign.status).toBe(404);
    const absent = await get(other, "/missing-ticket");
    for (const response of [foreign, absent]) {
      expect(response.status).toBe(404);
      expect(response.body.error).toMatchObject({ code: "SUPPORT_NOT_FOUND", message: "Ticket not found." });
    }
    expect((await get(other, `?q=${saved.id}`)).body.data.counts.all).toBe(0);
    expect((await post(other, `/${saved.id}/replies`, { version: 0, message: "intrusion" })).status).toBe(404);
    expect((await post(other, `/${saved.id}/resolve`, { version: 0 })).status).toBe(404);
    const detail = await get(member, `/${saved.id}`);
    expect(detail.body.data.messages[0].body).toBe("First message\nwith details");
    expect(JSON.stringify(detail.body)).not.toContain("@support.test");
  });
  it("rejects editorial/anonymous sessions and checks current marketplace verification/grants", async () => {
    expect((await request(app).get("/api/support")).status).toBe(401);
    expect((await request(app).get("/api/support/inbox").set("Cookie", `${auth.ADMIN_SESSION_COOKIE}=${"a".repeat(40)}`)).status).toBe(401);
    expect((await get(member, "/inbox")).status).toBe(403);
    expect((await get(moderator, "/inbox")).status).toBe(200);
    expect((await get(administrator, "/inbox")).status).toBe(200);
    await prisma.marketplaceRoleGrant.updateMany({ where: { userId: moderator.id }, data: { revokedAt: new Date() } });
    expect((await get(moderator, "/inbox")).status).toBe(403);
    await prisma.marketplaceRoleGrant.updateMany({ where: { userId: moderator.id }, data: { revokedAt: null } });
    await prisma.readerUser.update({ where: { id: moderator.id }, data: { emailVerifiedAt: null } });
    expect((await get(moderator, "/inbox")).status).toBe(403);
    await prisma.readerUser.update({ where: { id: moderator.id }, data: { emailVerifiedAt: new Date() } });
  });
  it("enforces CSRF, strict fields and trimmed limits without writing on rejection", async () => {
    const before = await prisma.supportTicket.count();
    const valid = { category: "GENERAL", subject: "X", message: "Y" };
    expect((await request(app).post("/api/support").set("Cookie", member.cookie).send(valid)).status).toBe(403);
    expect((await request(app).post("/api/support").set("Cookie", member.cookie).set("Origin", "https://evil.test").send(valid)).status).toBe(403);
    for (const body of [{ ...valid, ownerId: other.id }, { ...valid, subject: " " }, { ...valid, message: "x".repeat(5001) }]) expect((await post(member, "", body)).status).toBe(400);
    expect(await prisma.supportTicket.count()).toBe(before);
  });
  it("atomically replies/resolves/reopens and resolution is idempotent", async () => {
    const saved = await ticket();
    const staff = await post(moderator, `/inbox/${saved.id}/replies`, { version: 0, message: "Support response" });
    expect(staff.body.data).toMatchObject({ status: "WAITING_FOR_MEMBER", version: 1 });
    const resolved = await post(member, `/${saved.id}/resolve`, { version: 1 });
    expect(resolved.body.data).toMatchObject({ status: "RESOLVED", version: 2 });
    expect((await post(administrator, `/inbox/${saved.id}/resolve`, { version: 1 })).status).toBe(200);
    expect(await prisma.supportMessage.count({ where: { ticketId: saved.id, kind: "RESOLVED" } })).toBe(1);
    expect((await post(moderator, `/inbox/${saved.id}/replies`, { version: 2, message: "must reject" })).body.error.code).toBe("SUPPORT_RESOLVED");
    expect((await post(member, `/${saved.id}/replies`, { version: 2, message: "Reopen with details" })).body.data).toMatchObject({ status: "WAITING_FOR_SUPPORT", version: 3 });
    expect((await get(member, `/${saved.id}`)).body.data.messages.map((m: { kind: string }) => m.kind)).toEqual(["MESSAGE", "MESSAGE", "RESOLVED", "REOPENED"]);
  });
  it("labels staff-owned replies as owner messages", async () => {
    const saved = await ticket(moderator);
    expect((await post(moderator, `/inbox/${saved.id}/replies`, { version: 0, message: "My own request" })).body.data.status).toBe("WAITING_FOR_SUPPORT");
    const detail = await get(moderator, `/inbox/${saved.id}`);
    expect(detail.body.data.ticket.isOwner).toBe(true);
    expect(detail.body.data.messages.every((m: { role: string }) => m.role === "member")).toBe(true);
  });
  it("accepts one concurrent write and returns conflict without a partial message", async () => {
    const saved = await ticket();
    const replies = await Promise.all([
      post(moderator, `/inbox/${saved.id}/replies`, { version: 0, message: "One" }),
      post(administrator, `/inbox/${saved.id}/resolve`, { version: 0 }),
    ]);
    expect(replies.map(r => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.supportMessage.count({ where: { ticketId: saved.id } })).toBe(2);
  });
  it("bounds history, rejects cross-ticket cursors and preserves historical long messages", async () => {
    const saved = await ticket(); const unrelated = await ticket(other);
    const start = Date.now() - 100_000;
    await prisma.supportMessage.createMany({ data: Array.from({ length: 25 }, (_, i) => ({
      ticketId: saved.id, authorId: member.id, authorRole: "MEMBER" as const, body: i === 0 ? "x".repeat(10000) : `Message ${i}`, createdAt: new Date(start + i),
    })) });
    const latest = (await get(member, `/${saved.id}`)).body.data;
    expect(latest.messages).toHaveLength(20);
    const earlier = (await get(member, `/${saved.id}?before=${latest.earlierCursor}`)).body.data;
    expect(earlier.messages).toHaveLength(6);
    expect(earlier.earlierCursor).toBeNull();
    expect(earlier.messages[0].body).toHaveLength(10000);
    const foreignCursor = (await get(other, `/${unrelated.id}`)).body.data.messages[0].id;
    expect((await get(member, `/${saved.id}?before=${foreignCursor}`)).status).toBe(404);
  });
  it("paginates stable activity order and scopes filter counts before the selected status", async () => {
    const owner = await reader("pagination");
    const marker = `Sort ${run}`;
    await prisma.supportTicket.createMany({ data: Array.from({ length: 22 }, (_, index) => ({
      id: `sort-${run}-${String(index).padStart(2, "0")}`, ownerId: owner.id, category: "GENERAL" as const,
      subject: marker, status: index % 2 ? "WAITING_FOR_MEMBER" as const : "WAITING_FOR_SUPPORT" as const,
      updatedAt: new Date(Date.UTC(2026, 0, 1) + index * 1000),
    })) });
    const first = (await get(owner)).body.data;
    const second = (await get(owner, "?page=2")).body.data;
    expect(first.tickets).toHaveLength(20); expect(second.tickets).toHaveLength(2);
    expect(first.tickets[0].id).toBe(`sort-${run}-21`);
    expect(second.tickets.map((t: { id: string }) => t.id)).toEqual([`sort-${run}-01`, `sort-${run}-00`]);
    const filtered = (await get(owner, "?category=GENERAL&status=WAITING_FOR_SUPPORT")).body.data;
    expect(filtered.counts).toEqual({ all: 22, WAITING_FOR_SUPPORT: 11, WAITING_FOR_MEMBER: 11, RESOLVED: 0 });
    expect(filtered.total).toBe(11);
    const inbox = (await get(moderator, `/inbox?q=${encodeURIComponent(marker)}`)).body.data;
    expect(inbox.tickets.slice(0, 11).map((t: { id: string }) => t.id)).toEqual(Array.from({ length: 11 }, (_, i) => `sort-${run}-${String(i * 2).padStart(2, "0")}`));
  });
  it("exports only owned threads and authored replies elsewhere; erases staff content and retained files", async () => {
    const departing = await reader("departing", "MODERATOR");
    const owned = await ticket(departing);
    const foreign = await ticket(member, "Another person's private subject");
    await post(departing, `/inbox/${foreign.id}/replies`, { version: 0, message: "Departing staff content" });
    const ownMessage = await prisma.supportMessage.findFirstOrThrow({ where: { ticketId: owned.id } });
    const staffMessage = await prisma.supportMessage.findFirstOrThrow({ where: { ticketId: foreign.id, authorId: departing.id } });
    const keys = [randomUUID(), randomUUID()].map(id => `${id}.webp`);
    await mkdir(privateDirectory, { recursive: true });
    for (const [i, message] of [ownMessage, staffMessage].entries()) {
      await writeFile(new URL(keys[i], privateDirectory), "retained private fixture");
      await prisma.supportAttachment.create({ data: { messageId: message.id, storageKey: keys[i], bytes: 24, width: 1, height: 1 } });
    }
    await prisma.supportNotification.create({ data: { userId: departing.id, ticketId: foreign.id, type: "MEMBER_REPLIED" } });
    const exported = await request(app).get("/api/readers/profile/export").set("Cookie", departing.cookie);
    expect(exported.status).toBe(200);
    expect(exported.body.data.supportTickets.map((t: { id: string }) => t.id)).toEqual([owned.id]);
    expect(exported.body.data.supportMessages.map((m: { body: string }) => m.body)).toEqual(["Departing staff content"]);
    expect(JSON.stringify(exported.body)).not.toContain("Another person's private subject");
    expect(JSON.stringify(exported.body)).not.toContain(keys[0]);
    expect((await request(app).delete("/api/readers/profile").set("Origin", origin).set("Cookie", departing.cookie).send({ currentPassword: password })).status).toBe(204);
    expect(await prisma.supportTicket.count({ where: { id: owned.id } })).toBe(0);
    expect(await prisma.supportMessage.findUnique({ where: { id: staffMessage.id } })).toMatchObject({ authorId: null, body: "" });
    expect(await prisma.supportMessage.count({ where: { ticketId: foreign.id, authorId: member.id } })).toBe(1);
    expect(await prisma.supportNotification.count({ where: { userId: departing.id } })).toBe(0);
    for (const key of keys) await expect(readFile(new URL(key, privateDirectory))).rejects.toMatchObject({ code: "ENOENT" });
    expect((await post(departing, "", { category: "GENERAL", subject: "Late", message: "Must not resurrect" })).status).toBe(401);
  });
  it("serializes deletion with a delayed write so erased accounts cannot resurrect support data", async () => {
    const departing = await reader("race");
    const { lockSupportAccounts } = await import("../lib/supportAccess.js");
    let locked!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { locked = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    const deletion = prisma.$transaction(async tx => {
      await lockSupportAccounts(tx, [departing.id]); locked(); await gate;
      await tx.supportTicket.deleteMany({ where: { ownerId: departing.id } });
      await tx.readerUser.update({ where: { id: departing.id }, data: { deletedAt: new Date() } });
    });
    await ready;
    const delayed = post(departing, "", { category: "GENERAL", subject: "Late", message: "Must not persist" }).then(response => response);
    release(); await deletion;
    expect((await delayed).status).toBe(401);
    expect(await prisma.supportTicket.count({ where: { ownerId: departing.id } })).toBe(0);
  });
});
