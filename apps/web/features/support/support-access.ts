export function canManageSupport(user: { emailVerified: boolean; marketplaceRoles: readonly string[] }) {
  return user.emailVerified && user.marketplaceRoles.some(role => role === "administrator" || role === "moderator");
}
