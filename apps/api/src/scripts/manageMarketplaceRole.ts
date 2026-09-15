import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { toDatabaseMarketplaceRole } from "../lib/marketplaceRoles.js";

type Action = "grant" | "revoke";

function readFlag(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return typeof value === "string" && !value.startsWith("--") ? value.trim() : null;
}

function usage(): never {
  throw new Error(
    "Usage: npm run marketplace:role -- <grant|revoke> --email <reader-email> " +
      "--role <creator|moderator|administrator> --actor <operator-id> --reason <reason>",
  );
}

async function main() {
  const action = process.argv[2] as Action | undefined;
  const email = readFlag("email")?.toLowerCase();
  const publicRole = readFlag("role");
  const actor = readFlag("actor");
  const reason = readFlag("reason");
  const role = publicRole ? toDatabaseMarketplaceRole(publicRole) : null;

  if (action !== "grant" && action !== "revoke") usage();
  if (!email || !email.includes("@") || email.length > 320) usage();
  if (!role || !actor || !reason) usage();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9:._-]{1,119}$/.test(actor)) {
    throw new Error("--actor must be a 2-120 character non-email operator identifier");
  }
  if (reason.length < 8 || reason.length > 500) {
    throw new Error("--reason must be between 8 and 500 characters");
  }

  const user = await prisma.readerUser.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });
  if (!user) throw new Error("Reader account not found");
  if (action === "grant" && !user.emailVerifiedAt) {
    throw new Error("Reader email must be verified before marketplace roles can be granted");
  }

  const existing = await prisma.marketplaceRoleGrant.findUnique({
    where: { userId_role: { userId: user.id, role } },
    select: { id: true, revokedAt: true },
  });
  const active = Boolean(existing && !existing.revokedAt);
  if (action === "grant" && active) throw new Error("Marketplace role is already active");
  if (action === "revoke" && !active) throw new Error("Marketplace role is not active");

  const now = new Date();
  const correlationId = randomUUID();
  await prisma.$transaction(async (tx) => {
    if (action === "grant") {
      await tx.marketplaceRoleGrant.upsert({
        where: { userId_role: { userId: user.id, role } },
        create: { userId: user.id, role, grantedAt: now },
        update: { grantedAt: now, revokedAt: null },
      });
    } else {
      await tx.marketplaceRoleGrant.update({
        where: { userId_role: { userId: user.id, role } },
        data: { revokedAt: now },
      });
    }

    await tx.marketplaceRoleEvent.create({
      data: {
        subjectUserId: user.id,
        role,
        action: action === "grant" ? "GRANTED" : "REVOKED",
        actor,
        reason,
        correlationId,
      },
    });
  });

  console.log("Marketplace role operation completed", {
    action,
    role: publicRole,
    subjectUserId: user.id,
    correlationId,
  });
}

main()
  .catch((error) => {
    console.error("Marketplace role operation failed", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
