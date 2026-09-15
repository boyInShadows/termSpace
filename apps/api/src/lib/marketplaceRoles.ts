import type { MarketplaceRole } from "@prisma/client";

export const publicMarketplaceRoles = ["creator", "moderator", "administrator"] as const;
export type PublicMarketplaceRole = (typeof publicMarketplaceRoles)[number];

const publicRoleByDatabaseRole: Record<MarketplaceRole, PublicMarketplaceRole> = {
  CREATOR: "creator",
  MODERATOR: "moderator",
  ADMINISTRATOR: "administrator",
};

const databaseRoleByPublicRole: Record<PublicMarketplaceRole, MarketplaceRole> = {
  creator: "CREATOR",
  moderator: "MODERATOR",
  administrator: "ADMINISTRATOR",
};

export function toPublicMarketplaceRole(role: MarketplaceRole): PublicMarketplaceRole {
  return publicRoleByDatabaseRole[role];
}

export function toDatabaseMarketplaceRole(role: string): MarketplaceRole | null {
  return publicMarketplaceRoles.includes(role as PublicMarketplaceRole)
    ? databaseRoleByPublicRole[role as PublicMarketplaceRole]
    : null;
}
