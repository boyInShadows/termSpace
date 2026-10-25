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

function Refresh() {
  const session = useMarketplaceSession();
  return <button onClick={() => void session.refresh()}>Refresh</button>;
}

describe("marketplace session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } } });
    getFavorites.mockResolvedValue([]);
  });

  it("uses server-verified identity while revalidating, but keeps Saved loading", async () => {
    let resolveSession!: (value: Awaited<ReturnType<typeof getSession>>) => void;
    getSession.mockReturnValue(new Promise((resolve) => { resolveSession = resolve; }));
    const initialSession = { authenticated: true as const, user: { id: "reader", email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } };
    render(<MarketplaceSessionProvider initialSession={initialSession}><LoadingState /></MarketplaceSessionProvider>);
    expect(screen.getByText("false|true|reader@example.com|false")).toBeVisible();
    await vi.waitFor(() => expect(getSession).toHaveBeenCalledOnce());
    expect(screen.getByText("false|true|reader@example.com|false")).toBeVisible();
    expect(getFavorites).not.toHaveBeenCalled();
    await act(async () => { resolveSession({ data: initialSession }); });
    expect(await screen.findByText("false|false|reader@example.com|false")).toBeVisible();
  });

  it("discards server identity when browser revalidation finds an expired session", async () => {
    getSession.mockResolvedValue({ data: { authenticated: false } });
    const initialSession = { authenticated: true as const, user: { id: "reader", email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } };
    render(<MarketplaceSessionProvider initialSession={initialSession}><LoadingState /></MarketplaceSessionProvider>);
    expect(screen.getByText("false|true|reader@example.com|false")).toBeVisible();
    expect(await screen.findByText("false|false|Anonymous|false")).toBeVisible();
    expect(getFavorites).not.toHaveBeenCalled();
  });

  it("does not let an older identity response overwrite a newer refresh", async () => {
    let finishOlder!: (value: unknown) => void;
    getSession.mockReturnValueOnce(new Promise((resolve) => { finishOlder = resolve; }));
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "new@example.com", emailVerified: true, marketplaceRoles: [] } } });
    const initialSession = { authenticated: true as const, user: { id: "reader", email: "old@example.com", emailVerified: true, marketplaceRoles: [] } };
    render(<MarketplaceSessionProvider initialSession={initialSession}><LoadingState /><Refresh /></MarketplaceSessionProvider>);
    await vi.waitFor(() => expect(getSession).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("false|false|new@example.com|false")).toBeVisible();
    await act(async () => { finishOlder({ data: initialSession }); });
    expect(screen.getByText("false|false|new@example.com|false")).toBeVisible();
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
