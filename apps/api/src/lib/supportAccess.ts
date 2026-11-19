import type { Prisma } from "@prisma/client";

export class SupportError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

export async function lockSupportAccounts(tx: Prisma.TransactionClient, accountIds: string[]) {
  // shortcut: one lock serializes support writes/erasure; use ordered account locks if volume grows.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(1414746177, 1)`;
  const ids = [...new Set(accountIds)];
  if (await tx.readerUser.count({ where: { id: { in: ids }, deletedAt: null } }) !== ids.length) {
    throw new SupportError(401, "SUPPORT_SESSION_ENDED", "This account is no longer available. Sign in again.");
  }
}
