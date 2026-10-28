import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
const mocks = vi.hoisted(() => ({ get: vi.fn(), reader: vi.fn(), replace: vi.fn(), logout: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "fa", t: copy.fa }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "creator@example.test", marketplaceRoles: [], refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getOwnedCreatorProfile: mocks.get, getReaderProfile: mocks.reader, logout: mocks.logout }));
const { ApiError } = await import("@/lib/api");
const { AccountSettings } = await import("./account-settings");
const { accountSecurityCopy } = await import("./account-security-copy");

describe("account profile state", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.reader.mockResolvedValue({ createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false }); });
  it("does not claim a missing profile while loading, recovers a failure and isolates Latin identity", async () => {
    let reject!: (cause: Error) => void;
    mocks.get.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValue({ handle: "ellisnorth" });
    render(<AccountSettings />);
    expect(screen.getAllByRole("status").some((status) => status.textContent === copy.fa.creatorHub.loading)).toBe(true);
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    reject(new Error("offline"));
    await screen.findByRole("alert");
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.fa.creatorHub.retry }));
    expect(await screen.findByText("@ellisnorth")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("creator@example.test")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("link", { name: copy.fa.creatorHub.editTitle })).toHaveAttribute("href", "/fa/dashboard/studio#creator-profile");
  });
  it("reserves the empty profile message for a confirmed missing profile", async () => {
    mocks.get.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "missing"));
    render(<AccountSettings />);
    expect(await screen.findByText(copy.fa.settingsNoCreator)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("sign out", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reader.mockResolvedValue({ createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false });
    mocks.get.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "missing"));
  });
  async function signOut() {
    render(<AccountSettings />);
    await screen.findByText(copy.fa.settingsNoCreator);
    fireEvent.click(screen.getByRole("button", { name: copy.fa.signOut }));
  }

  it.each([
    ["an unreachable server", new TypeError("Failed to fetch"), accountSecurityCopy.fa.signOutOffline],
    ["a rate limit", new ApiError(429, "RATE_LIMITED", "slow down"), accountSecurityCopy.fa.rateLimited],
    ["a server failure", new ApiError(503, "API_ERROR", "down"), copy.fa.serviceError],
    ["any other rejection", new ApiError(403, "FORBIDDEN", "no"), copy.fa.dashboardHome.signOutError],
  ])("names the cause of %s and keeps the session", async (_name, failure, message) => {
    mocks.logout.mockRejectedValue(failure);
    await signOut();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("clears a previous failure and leaves the dashboard after a successful retry", async () => {
    mocks.logout.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce({});
    await signOut();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: copy.fa.signOut }));
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/fa"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
