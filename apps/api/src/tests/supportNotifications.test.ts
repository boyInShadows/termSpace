import type { Prisma } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
import { notifySupportParticipants } from "../lib/supportNotifications.js";

const db = { readerUser: { findMany: vi.fn() }, supportNotification: { createMany: vi.fn() } };
const tx = db as unknown as Prisma.TransactionClient;
beforeEach(() => vi.resetAllMocks());

it("addresses new tickets only to active, verified administrators other than the actor", async () => {
  db.readerUser.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);
  await notifySupportParticipants(tx, { ticketId: "ticket-1", ownerId: "member-1", actorId: "member-1", type: "TICKET_CREATED", audience: "staff" });
  expect(db.readerUser.findMany).toHaveBeenCalledWith({ where: {
    id: { not: "member-1" }, deletedAt: null, emailVerifiedAt: { not: null },
    marketplaceRoleGrants: { some: { role: "ADMINISTRATOR", revokedAt: null } },
  }, select: { id: true } });
  expect(db.supportNotification.createMany).toHaveBeenCalledWith({ data: [
    { ticketId: "ticket-1", userId: "admin-1", type: "TICKET_CREATED" },
    { ticketId: "ticket-1", userId: "admin-2", type: "TICKET_CREATED" },
  ] });
});

it("notifies only the owner of a staff reply and never notifies the actor", async () => {
  await notifySupportParticipants(tx, { ticketId: "ticket-1", ownerId: "member-1", actorId: "admin-1", type: "STAFF_REPLIED", audience: "member" });
  expect(db.supportNotification.createMany).toHaveBeenCalledWith({ data: [{ ticketId: "ticket-1", userId: "member-1", type: "STAFF_REPLIED" }] });
  db.supportNotification.createMany.mockClear();
  await notifySupportParticipants(tx, { ticketId: "ticket-1", ownerId: "member-1", actorId: "member-1", type: "STAFF_REPLIED", audience: "member" });
  expect(db.supportNotification.createMany).not.toHaveBeenCalled();
});
