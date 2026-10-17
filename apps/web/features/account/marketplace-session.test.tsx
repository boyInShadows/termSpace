import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const getFavorites = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api")>(), getSession, getFavorites }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
const { MarketplaceSessionProvider, useMarketplaceSession } = await import("./marketplace-session");

function Identity() {
  const session = useMarketplaceSession();
  return <p role="status">{session.loading ? "Loading" : `${session.email ?? "Anonymous"}|${session.emailVerified}|${session.error ?? ""}`}</p>;
}

describe("marketplace session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } } });
    getFavorites.mockResolvedValue([]);
  });

  it("keeps a successful sign-in when the favorites service fails", async () => {
    getFavorites.mockRejectedValue(new Error("Favorites offline"));
    render(<MarketplaceSessionProvider><Identity /></MarketplaceSessionProvider>);
    expect(await screen.findByText("reader@example.com|true|Could not load your saved products.")).toBeInTheDocument();
  });

  it("clears the identity if the session expires while favorites load", async () => {
    const { ApiError } = await import("@/lib/api");
    getFavorites.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Sign in"));
    render(<MarketplaceSessionProvider><Identity /></MarketplaceSessionProvider>);
    expect(await screen.findByText("Anonymous|false|")).toBeInTheDocument();
  });

  it("does not fetch favorites for a signed-out visitor", async () => {
    getSession.mockResolvedValue({ data: { authenticated: false } });
    render(<MarketplaceSessionProvider><Identity /></MarketplaceSessionProvider>);
    expect(await screen.findByText("Anonymous|false|")).toBeInTheDocument();
    expect(getFavorites).not.toHaveBeenCalled();
  });
});
