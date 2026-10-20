import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const getFavorites = vi.hoisted(() => vi.fn());
const setFavorite = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api")>(), getSession, getFavorites, setFavorite }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
const { MarketplaceSessionProvider, useMarketplaceSession } = await import("./marketplace-session");

function Identity() {
  const session = useMarketplaceSession();
  return <p role="status">{session.loading ? "Loading" : `${session.email ?? "Anonymous"}|${session.emailVerified}|${session.error ?? ""}`}</p>;
}

function SavedState() {
  const session = useMarketplaceSession();
  return <button onClick={() => void session.removeFavorite("saved").catch(() => {})}>{session.loading ? "Loading" : session.isFavorite("saved") ? "Saved" : "Removed"}</button>;
}

function LoadingState() {
  const session = useMarketplaceSession();
  return <p>{`${session.identityLoading}|${session.loading}|${session.email ?? "Anonymous"}|${session.isFavorite("saved")}`}</p>;
}

describe("marketplace session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } } });
    getFavorites.mockResolvedValue([]);
  });

  it("makes identity ready before favorites without declaring the saved snapshot ready", async () => {
    let resolveFavorites!: (slugs: string[]) => void;
    getFavorites.mockReturnValue(new Promise<string[]>((resolve) => { resolveFavorites = resolve; }));
    render(<MarketplaceSessionProvider><LoadingState /></MarketplaceSessionProvider>);
    expect(screen.getByText("true|true|Anonymous|false")).toBeVisible();
    expect(await screen.findByText("false|true|reader@example.com|false")).toBeVisible();
    await act(async () => { resolveFavorites(["saved"]); });
    expect(screen.getByText("false|false|reader@example.com|true")).toBeVisible();
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

  it("updates existing hearts after successful removal and retains them after a failed removal", async () => {
    getFavorites.mockResolvedValue(["saved"]);
    setFavorite.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    render(<MarketplaceSessionProvider><SavedState /></MarketplaceSessionProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Saved" }));
    await vi.waitFor(() => expect(setFavorite).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Saved" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Saved" }));
    expect(await screen.findByRole("button", { name: "Removed" })).toBeVisible();
    expect(setFavorite).toHaveBeenLastCalledWith("saved", false);
  });
});
