import request from "supertest";
import { beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
  marketplaceNotification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  supportNotification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
const { createApp } = await import("../app.js");
const cookie = "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456";
beforeEach(() => {
  vi.resetAllMocks();
  db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "member-1", emailVerifiedAt: null, marketplaceRoleGrants: [] } });
  db.$transaction.mockImplementation(async operations => Promise.all(operations));
  for (const feed of [db.marketplaceNotification, db.supportNotification]) {
    feed.findMany.mockResolvedValue([]); feed.count.mockResolvedValue(0); feed.updateMany.mockResolvedValue({ count: 0 });
  }
});

it("merges bounded support and moderation alerts without private message data", async () => {
  db.marketplaceNotification.findMany.mockResolvedValue([{ id: "moderation-1", type: "LISTING_APPROVED", publicReason: null, readAt: null, createdAt: new Date("2026-11-08"), product: { name: "A listing", slug: "a-listing" } }]);
  db.supportNotification.findMany.mockResolvedValue([{ id: "support-1", type: "STAFF_REPLIED", ticketId: "ticket-1", ticket: { ownerId: "member-1" }, readAt: null, createdAt: new Date("2026-11-09") }]);
  db.supportNotification.count.mockResolvedValue(1); db.marketplaceNotification.count.mockResolvedValue(2);
  const result = await request(createApp()).get("/api/marketplace/notifications").set("Cookie", cookie);
  expect(result.status).toBe(200);
  expect(result.headers["cache-control"]).toBe("private, no-store");
  expect(result.body.data.unread).toBe(3);
  expect(result.body.data.notifications[0]).toEqual({ id: "support-1", type: "support_reply", ticketId: "ticket-1", staff: false, readAt: null, createdAt: "2026-11-09T00:00:00.000Z" });
  expect(result.body.data.notifications[1].productName).toBe("A listing");
  expect(db.supportNotification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "member-1", ticket: { ownerId: "member-1" } }, take: 12 }));
});

it("hides former staff alerts from revoked administrators and scopes individual reads", async () => {
  const result = await request(createApp()).post("/api/marketplace/notifications/read").set("Cookie", cookie).set("Origin", "http://localhost:3000").send({ ids: ["someone-elses-alert"] });
  expect(result.status).toBe(200);
  expect(db.supportNotification.updateMany).toHaveBeenCalledWith({ where: { userId: "member-1", ticket: { ownerId: "member-1" }, readAt: null, id: { in: ["someone-elses-alert"] } }, data: { readAt: expect.any(Date) } });
});

it("allows currently verified administrators to read their staff alerts", async () => {
  db.readerSession.findFirst.mockResolvedValue({ id: "session", user: { id: "admin-1", emailVerifiedAt: new Date(), marketplaceRoleGrants: [{ role: "ADMINISTRATOR" }] } });
  await request(createApp()).get("/api/marketplace/notifications").set("Cookie", cookie);
  expect(db.supportNotification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "admin-1" } }));
});
