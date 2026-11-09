import type { Prisma } from "@prisma/client";

export class SupportSessionError extends Error {}

export async function requireActiveSupportAccounts(tx: Prisma.TransactionClient, accountIds: string[]) {
  // shortcut: serialize support writes/deletion; use ordered account locks if write volume grows.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(1414746177, 1)`;
  const ids = [...new Set(accountIds)];
  const active = await tx.readerUser.count({ where: { id: { in: ids }, deletedAt: null } });
  if (active !== ids.length) throw new SupportSessionError("The support account is no longer active");
}
