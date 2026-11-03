import { expect, it, vi } from "vitest";
import CommunitiesPage from "@/app/communities/page";

const getMarketplaceCommunities = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ getMarketplaceCommunities }));
vi.mock("@/lib/serverLocale", () => ({ getLocale: async () => "en" }));

it("sends failed directory requests to recovery instead of claiming no communities exist", async () => {
  getMarketplaceCommunities.mockRejectedValueOnce(new Error("directory unavailable"));
  await expect(CommunitiesPage()).rejects.toThrow("directory unavailable");
});
