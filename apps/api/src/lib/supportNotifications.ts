import type { Prisma, SupportNotificationType } from "@prisma/client";

export function visibleSupportNotifications(reader: { id: string; emailVerified: boolean; marketplaceRoles: string[] }) {
  const staff = reader.emailVerified && reader.marketplaceRoles.some(role => role === "administrator" || role === "moderator");
  return { userId: reader.id, ...(staff ? {} : { ticket: { ownerId: reader.id } }) };
}

export async function notifySupportParticipants(tx: Prisma.TransactionClient, event: {
  ticketId: string; ownerId: string; actorId: string; type: SupportNotificationType; audience: "member" | "staff";
}) {
  const recipients = event.audience === "staff"
    ? await tx.readerUser.findMany({
      where: { id: { not: event.actorId }, deletedAt: null, emailVerifiedAt: { not: null }, marketplaceRoleGrants: { some: { role: { in: ["ADMINISTRATOR", "MODERATOR"] }, revokedAt: null } } },
      select: { id: true },
    })
    : event.ownerId === event.actorId ? [] : [{ id: event.ownerId }];
  if (!recipients.length) return;
  await tx.supportNotification.createMany({ data: recipients.map(user => ({ userId: user.id, ticketId: event.ticketId, type: event.type })) });
}
