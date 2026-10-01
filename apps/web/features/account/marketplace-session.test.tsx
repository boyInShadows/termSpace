import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const getFavorites = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getSession,
  getFavorites,
}));

const { ApiError } = await import("@/lib/api");
const { MarketplaceSessionProvider, useMarketplaceSession } = await import("./marketplace-session");

function SessionProbe() {
  const session = useMarketplaceSession();
  return <p>{session.loading ? "Loading" : `${session.email ?? "Anonymous"}:${session.marketplaceRoles.join(",")}:${session.error ?? "ready"}`}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    data: { user: { email: "creator@example.com", emailVerified: true, marketplaceRoles: ["creator"] } },
  });
});
afterEach(cleanup);

it("keeps a restricted reader signed in when favorites are unavailable", async () => {
  getFavorites.mockRejectedValue(new ApiError(403, "MARKETPLACE_RESTRICTED", "Marketplace access is restricted"));
  render(<MarketplaceSessionProvider><SessionProbe /></MarketplaceSessionProvider>);
  expect(await screen.findByText("creator@example.com:creator:ready")).toBeInTheDocument();
});
