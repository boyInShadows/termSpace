import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supportWriteRateLimit } from "../middleware/security.js";

const db = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
  readerUser: { findMany: vi.fn() }, supportNotification: { createMany: vi.fn() },
  supportTicket: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  supportMessage: { findMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
const { createApp } = await import("../app.js");
const cookie = "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456";
const input = { category: "TECHNICAL", subject: "Cannot open listing", body: "The listing page fails when I open the latest release." };

describe("private member support", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    db.readerUser.findMany.mockResolvedValue([]);
    await supportWriteRateLimit.resetKey("member-1");
    await supportWriteRateLimit.resetKey("admin-1");
    db.readerSession.findFirst.mockResolvedValue({ id: "session", user: {
      id: "member-1", email: "member@example.test", emailVerifiedAt: null, marketplaceRoleGrants: [],
    } });
    db.supportTicket.findMany.mockResolvedValue([]);
    db.supportTicket.create.mockResolvedValue({ id: "ticket-1" });
    db.$transaction.mockImplementation(async (run: (tx: typeof db) => unknown) => run(db));
    db.supportTicket.updateMany.mockResolvedValue({ count: 1 });
  });

  it("requires a reader session", async () => {
    expect((await request(createApp()).get("/api/support/tickets")).status).toBe(401);
    expect((await request(createApp()).post("/api/support/tickets").send(input)).status).toBe(401);
  });

  it("lets an unverified member list only their own tickets without caching", async () => {
    const result = await request(createApp()).get("/api/support/tickets").set("Cookie", cookie);
    expect(result.status).toBe(200);
    expect(result.headers["cache-control"]).toContain("no-store");
    expect(db.supportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: "member-1" }, take: 21,
    }));
  });

  it("sets owner, author and status on the server", async () => {
    const result = await request(createApp()).post("/api/support/tickets").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send(input);
    expect(result.status).toBe(201);
    expect(db.supportTicket.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
      ownerId: "member-1", category: "TECHNICAL", subject: input.subject,
      messages: { create: { body: input.body, authorId: "member-1", authorRole: "MEMBER" } },
    } }));
  });

  it.each([{ ...input, ownerId: "other" }, { ...input, status: "RESOLVED" },
    { ...input, category: "other" }, { ...input, subject: " " }, { ...input, body: " " }])("rejects invalid or forged fields", async (body) => {
    expect((await request(createApp()).post("/api/support/tickets").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send(body)).status).toBe(400);
    expect(db.supportTicket.create).not.toHaveBeenCalled();
  });

  it("makes another member's ticket indistinguishable from a missing ticket", async () => {
    db.supportTicket.findFirst.mockResolvedValue(null);
    expect((await request(createApp()).get("/api/support/tickets/ticket-1").set("Cookie", cookie)).status).toBe(404);
    expect(db.supportTicket.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "ticket-1", ownerId: "member-1" } }));
    expect(db.supportMessage.findMany).not.toHaveBeenCalled();
  });

  it("rejects cross-origin writes and unbounded pagination", async () => {
    expect((await request(createApp()).post("/api/support/tickets").set("Cookie", cookie)
      .set("Origin", "https://evil.test").send(input)).status).toBe(403);
    expect((await request(createApp()).get("/api/support/tickets?page=-1").set("Cookie", cookie)).status).toBe(400);
  });

  it.each([{ roles: [] }, { roles: [{ role: "MODERATOR" }] }, { roles: [{ role: "CREATOR" }] }])("denies non-administrators the shared inbox", async ({ roles }) => {
    db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "member-1", email: "x@example.test", emailVerifiedAt: new Date(), marketplaceRoleGrants: roles } });
    expect((await request(createApp()).get("/api/support/admin/tickets").set("Cookie", cookie)).status).toBe(403);
    expect(db.supportTicket.findMany).not.toHaveBeenCalled();
  });

  it("lets an existing administrator read the bounded inbox", async () => {
    db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "admin-1", email: "x@example.test", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "ADMINISTRATOR" }] } });
    const result = await request(createApp()).get("/api/support/admin/tickets?status=RESOLVED").set("Cookie", cookie);
    expect(result.status).toBe(200);
    expect(db.supportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "RESOLVED" }, take: 21 }));
  });

  it("member replies reopen resolved tickets atomically and cannot forge staff authorship", async () => {
    db.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", ownerId: "member-1", status: "RESOLVED", version: 2 });
    const result = await request(createApp()).post("/api/support/tickets/ticket-1/messages").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ body: "The issue still happens.", expectedVersion: 2 });
    expect(result.status).toBe(201);
    expect(db.supportTicket.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "ticket-1", ownerId: "member-1", version: 2 }, data: expect.objectContaining({ status: "WAITING_FOR_SUPPORT", version: { increment: 1 } }) }));
    expect(db.supportMessage.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorRole: "MEMBER", authorId: "member-1" }) }));
    expect((await request(createApp()).post("/api/support/tickets/ticket-1/messages").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ body: "forged", expectedVersion: 2, authorRole: "ADMINISTRATOR" })).status).toBe(400);
  });

  it("rejects stale replies without saving a message", async () => {
    db.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", ownerId: "member-1", version: 3 });
    db.supportTicket.updateMany.mockResolvedValue({ count: 0 });
    expect((await request(createApp()).post("/api/support/tickets/ticket-1/messages").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ body: "Latest reply", expectedVersion: 2 })).status).toBe(409);
    expect(db.supportMessage.create).not.toHaveBeenCalled();
  });

  it("administrator replies wait for the member and either participant can resolve", async () => {
    db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "admin-1", email: "x@example.test", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "ADMINISTRATOR" }] } });
    db.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", ownerId: "member-1", version: 0, status: "WAITING_FOR_SUPPORT" });
    expect((await request(createApp()).post("/api/support/admin/tickets/ticket-1/messages").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ body: "Please try the latest release.", expectedVersion: 0 })).status).toBe(201);
    expect(db.supportTicket.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "WAITING_FOR_MEMBER" }) }));
    expect(db.supportMessage.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorRole: "ADMINISTRATOR" }) }));
    expect((await request(createApp()).post("/api/support/admin/tickets/ticket-1/resolve").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ expectedVersion: 0 })).status).toBe(200);
  });

  it("keeps the staff reopen restriction inside the optimistic write", async () => {
    db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "admin-1", email: "x@example.test", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "ADMINISTRATOR" }] } });
    db.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", status: "WAITING_FOR_SUPPORT" });
    db.supportTicket.updateMany.mockResolvedValue({ count: 0 });
    const result = await request(createApp()).post("/api/support/admin/tickets/ticket-1/messages").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ body: "A concurrent reply", expectedVersion: 1 });
    expect(result.status).toBe(409);
    expect(db.supportTicket.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { not: "RESOLVED" } }),
    }));
    expect(db.supportMessage.create).not.toHaveBeenCalled();
  });

  it("does not generate more alerts when an already resolved ticket is resolved again", async () => {
    db.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", ownerId: "member-1", status: "RESOLVED" });
    const result = await request(createApp()).post("/api/support/tickets/ticket-1/resolve").set("Cookie", cookie)
      .set("Origin", "http://localhost:3000").send({ expectedVersion: 3 });
    expect(result.status).toBe(200);
    expect(db.supportTicket.updateMany).not.toHaveBeenCalled();
    expect(db.readerUser.findMany).not.toHaveBeenCalled();
  });
});
