import request from "supertest";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supportWriteRateLimit } from "../middleware/security.js";

const mocks = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() }, supportAttachment: { findFirst: vi.fn() },
  readerUser: { findMany: vi.fn(), count: vi.fn() }, $executeRaw: vi.fn(), supportNotification: { createMany: vi.fn() },
  supportTicket: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  supportMessage: { create: vi.fn() }, $transaction: vi.fn(),
  prepare: vi.fn(), read: vi.fn(), remove: vi.fn(),
}));
vi.mock("../lib/prisma.js", () => ({ prisma: mocks }));
vi.mock("../lib/supportImages.js", async importOriginal => ({
  ...await importOriginal<typeof import("../lib/supportImages.js")>(),
  prepareSupportImages: mocks.prepare, readSupportImage: mocks.read, removeSupportImages: mocks.remove,
}));
const { createApp } = await import("../app.js");
const { createSupportTicket } = await import("../controllers/supportController.js");
const cookie = "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456";
const input = { category: "TECHNICAL", subject: "Screenshot of a problem", body: "The latest release cannot open. Please inspect this screenshot." };
const image = { storageKey: "private-key.webp", bytes: 100, width: 48, height: 32 };
const upload = () => request(createApp()).post("/api/support/tickets").set("Cookie", cookie).set("Origin", "http://localhost:3000");

describe("private support screenshot boundaries", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.readerUser.findMany.mockResolvedValue([]);
    mocks.readerUser.count.mockImplementation(async ({ where }) => where.id.in.filter(Boolean).length);
    await supportWriteRateLimit.resetKey("member-1");
    mocks.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "member-1", emailVerifiedAt: null, marketplaceRoleGrants: [] } });
    mocks.prepare.mockResolvedValue([image]); mocks.remove.mockResolvedValue(undefined);
    mocks.supportTicket.create.mockResolvedValue({ id: "ticket-1" });
    mocks.supportTicket.findFirst.mockResolvedValue({ id: "ticket-1", ownerId: "member-1", status: "WAITING_FOR_SUPPORT" });
    mocks.$transaction.mockImplementation(async run => run(mocks));
  });

  it("validates the multipart payload and saves private metadata without returning storage keys", async () => {
    const result = await upload().field("payload", JSON.stringify(input)).attach("screenshots", Buffer.from("fixture"), "screen.png");
    expect(result.status).toBe(201);
    expect(mocks.supportTicket.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      messages: { create: expect.objectContaining({ attachments: { create: [image] } }) },
    }) }));
    expect(JSON.stringify(result.body)).not.toContain(image.storageKey);
    const invalid = await upload().field("payload", JSON.stringify({ ...input, ownerId: "stranger" })).attach("screenshots", Buffer.from("fixture"), "screen.png");
    expect(invalid.status).toBe(400);
  });

  it("rejects malformed multipart requests as client errors", async () => {
    expect((await upload().set("Content-Type", "multipart/form-data").send("missing boundary")).status).toBe(400);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it("rejects oversized files before image processing", async () => {
    const result = await upload().field("payload", JSON.stringify(input)).attach("screenshots", Buffer.alloc(5 * 1024 * 1024 + 1), "screen.png");
    expect(result.status).toBe(413);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it("accepts all three allowed screenshot parts", async () => {
    const result = await upload().field("payload", JSON.stringify(input))
      .attach("screenshots", Buffer.from("one"), "one.png")
      .attach("screenshots", Buffer.from("two"), "two.png")
      .attach("screenshots", Buffer.from("three"), "three.png");
    expect(result.status).toBe(201);
    expect(mocks.prepare.mock.calls[0]![0]).toHaveLength(3);
  });

  it("limits writes by authenticated member before buffering more uploads", async () => {
    for (let index = 0; index < 10; index++) expect((await upload().send(input)).status).toBe(201);
    expect((await upload().send(input)).status).toBe(429);
    expect(mocks.prepare).toHaveBeenCalledTimes(10);
  });

  it("removes prepared images when creation fails or a reply conflicts", async () => {
    mocks.supportTicket.create.mockRejectedValueOnce(new Error("Synthetic write failure"));
    expect((await upload().field("payload", JSON.stringify(input)).attach("screenshots", Buffer.from("fixture"), "screen.png")).status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledWith([image.storageKey]);
    mocks.supportTicket.updateMany.mockResolvedValue({ count: 0 });
    const reply = await request(createApp()).post("/api/support/tickets/ticket-1/messages").set("Cookie", cookie).set("Origin", "http://localhost:3000")
      .field("payload", JSON.stringify({ body: "Stale reply", expectedVersion: 0 })).attach("screenshots", Buffer.from("fixture"), "screen.png");
    expect(reply.status).toBe(409);
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(mocks.supportMessage.create).not.toHaveBeenCalled();
  });

  it("keeps committed images if sending the HTTP response fails", async () => {
    const res = { locals: { reader: { id: "member-1" } }, status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    res.json.mockImplementation(() => { throw new Error("Synthetic response failure"); });
    await expect(createSupportTicket({ body: input } as Request, res as unknown as Response)).rejects.toThrow("Synthetic response failure");
    expect(mocks.supportTicket.create).toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("scopes every download to its owner before reading the private file", async () => {
    mocks.supportAttachment.findFirst.mockResolvedValue(null);
    const result = await request(createApp()).get("/api/support/attachments/image-1").set("Cookie", cookie);
    expect(result.status).toBe(404);
    expect(mocks.supportAttachment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: {
      id: "image-1", message: { ticket: { ownerId: "member-1" } },
    } }));
    expect(mocks.read).not.toHaveBeenCalled();
    expect((await request(createApp()).get("/api/support/admin/attachments/image-1").set("Cookie", cookie)).status).toBe(403);
  });

  it("serves authorized images privately with nosniff and reports missing files", async () => {
    mocks.supportAttachment.findFirst.mockResolvedValue({ storageKey: image.storageKey });
    mocks.read.mockResolvedValue(Buffer.from("synthetic image"));
    const result = await request(createApp()).get("/api/support/attachments/image-1").set("Cookie", cookie);
    expect(result.status).toBe(200);
    expect(result.headers["content-type"]).toContain("image/webp");
    expect(result.headers["cache-control"]).toContain("private, no-store");
    expect(result.headers["x-content-type-options"]).toBe("nosniff");
    mocks.read.mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
    expect((await request(createApp()).get("/api/support/attachments/image-1").set("Cookie", cookie)).status).toBe(404);
  });
});
