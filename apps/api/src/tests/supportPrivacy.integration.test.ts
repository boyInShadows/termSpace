import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { readSupportImage, removeSupportImages } from "../lib/supportImages.js";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const origin = "http://localhost:3000";
const password = "synthetic-support-private-password";

describe.skipIf(!databaseUrl)("private support account lifecycle on PostgreSQL", () => {
  let prisma: import("@prisma/client").PrismaClient;
  let app: import("express").Express;
  let auth: typeof import("../middleware/auth.js");
  const users: string[] = [];
  const files = new Set<string>();

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set("connection_limit", "4");
    vi.stubEnv("DATABASE_URL", url.href);
    vi.stubEnv("CORS_ORIGINS", origin);
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    ({ prisma } = await import("../lib/prisma.js"));
    auth = await import("../middleware/auth.js");
    app = (await import("../app.js")).createApp();
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.readerUser.deleteMany({ where: { id: { in: users } } });
    await removeSupportImages([...files]);
    users.length = 0; files.clear();
  });
  afterAll(async () => { if (prisma) await prisma.$disconnect(); vi.unstubAllEnvs(); });

  async function reader(staff = false) {
    const user = await prisma.readerUser.create({ data: {
      email: `${randomUUID()}@support-privacy.test`, passwordHash: await hash(password, 4),
      emailVerifiedAt: staff ? new Date() : null,
      ...(staff ? { marketplaceRoleGrants: { create: { role: "ADMINISTRATOR" } } } : {}),
    } });
    users.push(user.id);
    const token = randomBytes(32).toString("base64url");
    await prisma.readerSession.create({ data: { userId: user.id, tokenHash: auth.hashSessionToken(token), expiresAt: new Date(Date.now() + 3_600_000) } });
    return { id: user.id, cookie: `${auth.READER_SESSION_COOKIE}=${token}` };
  }
  async function createTicket(cookie: string, body: string) {
    const png = await sharp({ create: { width: 12, height: 12, channels: 3, background: "blue" } }).png().toBuffer();
    const result = await request(app).post("/api/support/tickets").set("Cookie", cookie).set("Origin", origin)
      .field("payload", JSON.stringify({ category: "GENERAL", subject: "Synthetic private ticket", body }))
      .attach("screenshots", png, { filename: "private.png", contentType: "image/png" });
    expect(result.status).toBe(201);
    const id = String(result.body.data.id);
    const images = await prisma.supportAttachment.findMany({ where: { message: { ticketId: id } }, select: { id: true, storageKey: true } });
    images.forEach(image => files.add(image.storageKey));
    return { id, images };
  }
  const remove = (cookie: string) => request(app).delete("/api/readers/profile").set("Cookie", cookie).set("Origin", origin).send({ currentPassword: password });

  it("exports owned conversations without other members' tickets or storage keys", async () => {
    const owner = await reader(); const other = await reader(); const staff = await reader(true);
    const ticket = await createTicket(owner.cookie, "Owner private message for export.");
    await createTicket(other.cookie, "Other member private message must stay out of the export.");
    expect((await request(app).post(`/api/support/admin/tickets/${ticket.id}/messages`).set("Cookie", staff.cookie).set("Origin", origin).send({ body: "Staff response for the owner.", expectedVersion: 0 })).status).toBe(201);
    const exported = await request(app).get("/api/readers/profile/export").set("Cookie", owner.cookie);
    expect(exported.status).toBe(200);
    expect(exported.body.data.supportTickets).toHaveLength(1);
    expect(exported.body.data.supportTickets[0].messages.map((message: { body: string }) => message.body)).toEqual(["Owner private message for export.", "Staff response for the owner."]);
    expect(JSON.stringify(exported.body)).not.toContain("Other member private message");
    expect(JSON.stringify(exported.body)).not.toContain("storageKey");
    expect(JSON.stringify(exported.body)).not.toContain("passwordHash");
    expect(exported.body.data.supportTickets[0].messages[0].attachments[0].downloadPath).toBe(`/api/support/attachments/${ticket.images[0]!.id}`);
  });

  it("deletes owned threads, recipient alerts and images while preserving another account", async () => {
    const owner = await reader(); const other = await reader(); await reader(true);
    const ticket = await createTicket(owner.cookie, "Owner private message to erase.");
    const retained = await createTicket(other.cookie, "Other member private message to retain.");
    expect((await remove(owner.cookie)).status).toBe(204);
    expect(await prisma.supportTicket.count({ where: { ownerId: owner.id } })).toBe(0);
    expect(await prisma.supportNotification.count({ where: { OR: [{ userId: owner.id }, { ticketId: ticket.id }] } })).toBe(0);
    for (const image of ticket.images) await expect(readSupportImage(image.storageKey)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await request(app).get(`/api/support/attachments/${retained.images[0]!.id}`).set("Cookie", other.cookie)).status).toBe(200);
    expect((await request(app).get("/api/support/tickets").set("Cookie", owner.cookie)).status).toBe(401);
  });

  it("exports only staff-authored content and erases it without deleting the member's ticket", async () => {
    const owner = await reader(); const staff = await reader(true);
    const ticket = await createTicket(owner.cookie, "Member content not owned by the staff account.");
    expect((await request(app).post(`/api/support/admin/tickets/${ticket.id}/messages`).set("Cookie", staff.cookie).set("Origin", origin).send({ body: "Staff-authored private message.", expectedVersion: 0 })).status).toBe(201);
    await prisma.marketplaceRoleGrant.updateMany({ where: { userId: staff.id }, data: { revokedAt: new Date() } });
    const exported = await request(app).get("/api/readers/profile/export").set("Cookie", staff.cookie);
    expect(exported.body.data.supportMessages).toHaveLength(1);
    expect(exported.body.data.supportNotifications).toEqual([]);
    expect(JSON.stringify(exported.body)).toContain("Staff-authored private message.");
    expect(JSON.stringify(exported.body)).not.toContain("Member content not owned");
    expect((await remove(staff.cookie)).status).toBe(204);
    const thread = await request(app).get(`/api/support/tickets/${ticket.id}`).set("Cookie", owner.cookie);
    expect(thread.status).toBe(200);
    expect(thread.body.data.messages[0].body).toBe("Member content not owned by the staff account.");
    expect(thread.body.data.messages[1].body).toBe("");
    expect(await prisma.supportMessage.count({ where: { authorId: staff.id } })).toBe(0);
  });

  it("waits for an in-flight ticket write before erasing the account", async () => {
    const owner = await reader();
    const transaction = prisma.$transaction.bind(prisma);
    let release!: () => void;
    let entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const started = new Promise<void>(resolve => { entered = resolve; });
    const spy = vi.spyOn(prisma, "$transaction").mockImplementationOnce(async run => {
      if (typeof run !== "function") throw new Error("Expected a callback transaction");
      return transaction(async tx => {
        const result = await run(tx);
        entered(); await held;
        return result;
      });
    });
    const creation = request(app).post("/api/support/tickets").set("Cookie", owner.cookie).set("Origin", origin)
      .send({ category: "GENERAL", subject: "In-flight private ticket", body: "This synthetic ticket must not survive deletion." }).then(result => result);
    let deletion: Promise<request.Response> | undefined;
    try {
      await started;
      deletion = remove(owner.cookie).then(result => result);
      const observed = await prisma.$queryRaw<{ classid: bigint; objid: bigint; objsubid: number; granted: boolean }[]>`SELECT classid::bigint, objid::bigint, objsubid, granted FROM pg_locks WHERE locktype = 'advisory' AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`;
      expect(observed.some(row => row.classid === 1414746177n && row.objid === 1n && row.granted)).toBe(true);
      await vi.waitFor(async () => {
        const rows = await prisma.$queryRaw<{ waiting: number }[]>`SELECT count(*)::int AS waiting FROM pg_locks WHERE locktype = 'advisory' AND classid = 1414746177::oid AND objid = 1::oid AND objsubid = 2 AND NOT granted AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`;
        expect(rows[0]!.waiting).toBeGreaterThan(0);
      }, { timeout: 2000 });
      release();
      expect((await creation).status).toBe(201);
      expect((await deletion).status).toBe(204);
      expect(await prisma.supportTicket.count({ where: { ownerId: owner.id } })).toBe(0);
      const afterDeletion = await request(app).post("/api/support/tickets").set("Cookie", owner.cookie).set("Origin", origin)
        .send({ category: "GENERAL", subject: "Too late to save", body: "An erased account cannot recreate a ticket." });
      expect(afterDeletion.status).toBe(401);
    } finally {
      release(); await creation; if (deletion) await deletion; spy.mockRestore();
    }
  });

  it("completes deletion and blocks access when physical file cleanup must be retried", async () => {
    const owner = await reader();
    const ticket = await createTicket(owner.cookie, "Private message with a temporarily locked screenshot.");
    const imageModule = await import("../lib/supportImages.js");
    vi.spyOn(imageModule, "removeSupportImages").mockRejectedValueOnce(Object.assign(new Error("Synthetic locked file"), { code: "EPERM" }));
    expect((await remove(owner.cookie)).status).toBe(204);
    expect(await prisma.supportAttachment.count({ where: { id: ticket.images[0]!.id } })).toBe(0);
    expect((await request(app).get(`/api/support/attachments/${ticket.images[0]!.id}`).set("Cookie", owner.cookie)).status).toBe(401);
    expect((await request(app).get(`/media/${ticket.images[0]!.storageKey}`)).status).toBe(404);
    expect(await readSupportImage(ticket.images[0]!.storageKey)).toBeInstanceOf(Buffer);
  });
});
