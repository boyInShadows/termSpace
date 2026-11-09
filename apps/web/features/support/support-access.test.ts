import { expect, it } from "vitest";
import { canManageSupport } from "./support-access";

it.each([
  [true, ["administrator"], true],
  [true, ["moderator"], true],
  [true, ["creator"], false],
  [true, [], false],
  [false, ["administrator"], false],
  [false, ["moderator"], false],
] as const)("checks verified support staff: %s %j", (emailVerified, marketplaceRoles, allowed) => {
  expect(canManageSupport({ emailVerified, marketplaceRoles })).toBe(allowed);
});
