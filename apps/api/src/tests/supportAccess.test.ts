import type { Prisma } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
import { requireActiveSupportAccounts, SupportSessionError } from "../lib/supportAccess.js";

const db = { $executeRaw: vi.fn(), readerUser: { count: vi.fn() } };
beforeEach(() => vi.resetAllMocks());

it("serializes the write and checks each distinct account after obtaining the lock", async () => {
  db.readerUser.count.mockResolvedValue(1);
  await requireActiveSupportAccounts(db as unknown as Prisma.TransactionClient, ["owner-1", "owner-1"]);
  expect(db.$executeRaw).toHaveBeenCalledOnce();
  expect(db.readerUser.count).toHaveBeenCalledWith({ where: { id: { in: ["owner-1"] }, deletedAt: null } });
  expect(db.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(db.readerUser.count.mock.invocationCallOrder[0]!);
});

it("rejects a missing or deleted actor/owner after an in-flight request was authenticated", async () => {
  db.readerUser.count.mockResolvedValue(1);
  await expect(requireActiveSupportAccounts(db as unknown as Prisma.TransactionClient, ["owner-1", "staff-1"])).rejects.toBeInstanceOf(SupportSessionError);
});
