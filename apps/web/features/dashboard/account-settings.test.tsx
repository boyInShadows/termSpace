import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
const mocks = vi.hoisted(() => ({ get: vi.fn(), reader: vi.fn(), replace: vi.fn(), logout: vi.fn(), update: vi.fn(), sessionRefresh: vi.fn(), preferences: vi.fn(), onboarding: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }), useSearchParams: () => mocks.params }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "fa", t: copy.fa }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "creator@example.test", marketplaceRoles: [], refresh: mocks.sessionRefresh }) }));
vi.mock("@/lib/account-api", async (original) => ({ ...await original<typeof import("@/lib/account-api")>(), getEmailPreferences: mocks.preferences }));
vi.mock("@/lib/onboarding-api", async (original) => ({ ...await original<typeof import("@/lib/onboarding-api")>(), getOnboarding: mocks.onboarding }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getOwnedCreatorProfile: mocks.get, getReaderProfile: mocks.reader, logout: mocks.logout, updateOwnedCreatorProfile: mocks.update }));
const { ApiError } = await import("@/lib/api");
const { AccountSettings } = await import("./account-settings");
const creator = { handle: "ellisnorth", name: "Ellis North", bio: "Builds careful agentic coding tools.", accessActive: true };
const { accountSecurityCopy } = await import("./account-security-copy");
const { accountSettingsCopy } = await import("./account-settings-copy");
beforeEach(() => {
  mocks.onboarding.mockResolvedValue({ required: false, role: null, goal: null, tools: [], intent: null });
  mocks.params = new URLSearchParams();
});

describe("account profile state", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.reader.mockResolvedValue({ createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false }); mocks.preferences.mockResolvedValue({ newsletter: true, moderation: true }); });  it("does not claim a missing profile while loading, recovers a failure and isolates Latin identity", async () => {
    let reject!: (cause: Error) => void;
    mocks.get.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValue(creator);
    render(<AccountSettings />);
    expect(screen.getAllByRole("status").some((status) => status.textContent === copy.fa.creatorHub.loading)).toBe(true);
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    reject(new Error("offline"));
    await screen.findByRole("alert");
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.fa.creatorHub.retry }));
    expect(await screen.findByText("@ellisnorth")).toHaveAttribute("dir", "ltr");
    // The header and the (hidden) sign-in row both show the address; each isolates it.
    for (const email of screen.getAllByText("creator@example.test", { ignore: false })) expect(email).toHaveAttribute("dir", "ltr");
    expect(screen.queryByRole("link", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
  });
  it("edits the creator profile here and keeps the permanent handle read-only", async () => {
    mocks.get.mockResolvedValue(creator);
    mocks.update.mockResolvedValue({ ...creator, name: "Ellis N", bio: "A new biography that is long enough." });
    render(<AccountSettings />);
    const edit = await screen.findByRole("button", { name: `${accountSettingsCopy.fa.edit} — ${copy.fa.creatorHub.editTitle}` });
    expect(screen.queryByRole("form", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
    fireEvent.click(edit);
    const form = await screen.findByRole("form", { name: copy.fa.creatorHub.editTitle });
    expect(within(form).getByLabelText(copy.fa.creatorHub.name)).toHaveValue("Ellis North");
    expect(within(form).getByLabelText(copy.fa.creatorHub.handle)).toBeDisabled();
    fireEvent.change(within(form).getByLabelText(copy.fa.creatorHub.name), { target: { value: "Ellis N" } });
    fireEvent.change(within(form).getByLabelText(copy.fa.creatorHub.bio), { target: { value: "A new biography that is long enough." } });
    fireEvent.change(within(form).getByLabelText(copy.fa.creatorHub.avatar), { target: { value: "https://avatars.githubusercontent.com/u/1?v=4" } });
    fireEvent.click(within(form).getByRole("button", { name: copy.fa.creatorHub.save }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ name: "Ellis N", bio: "A new biography that is long enough.", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4" }));
    expect(await screen.findByText(copy.fa.creatorHub.saved)).toBeVisible();
    // Saving returns to the summary, showing the saved values, with focus back on Edit.
    expect(screen.queryByRole("form", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
    expect(screen.getByText("A new biography that is long enough.")).toBeVisible();
    await waitFor(() => expect(screen.getByRole("button", { name: `${accountSettingsCopy.fa.edit} — ${copy.fa.creatorHub.editTitle}` })).toHaveFocus());
    expect(mocks.sessionRefresh).not.toHaveBeenCalled();
  });
  it("links every section and leaves out Connections for an account without the creator role", async () => {
    mocks.get.mockResolvedValue(creator);
    render(<AccountSettings />);
    await screen.findByText("@ellisnorth");
    const nav = within(screen.getByRole("navigation", { name: accountSettingsCopy.fa.sectionsLabel }));
    expect(nav.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/fa/dashboard/settings",
      "/fa/dashboard/settings?section=account",
      "/fa/dashboard/settings?section=notifications",
      "/fa/dashboard/settings?section=privacy",
    ]);
    expect(nav.getByRole("link", { name: accountSettingsCopy.fa.profile })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 2, name: accountSettingsCopy.fa.profile })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2, name: accountSettingsCopy.fa.account })).not.toBeInTheDocument();
    // First-run onboarding answers are not part of Profile, so Settings never asks for them.
    expect(mocks.onboarding).not.toHaveBeenCalled();
  });
  it("shows only the section named in the query and falls back to Profile for an unknown one", async () => {
    mocks.get.mockResolvedValue(creator);
    mocks.params = new URLSearchParams("section=account");
    const { unmount } = render(<AccountSettings />);
    await screen.findByText("@ellisnorth");
    expect(screen.getByRole("heading", { level: 2, name: accountSettingsCopy.fa.account })).toBeVisible();
    expect(screen.getByRole("link", { name: accountSettingsCopy.fa.account })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("heading", { level: 2, name: accountSettingsCopy.fa.profile })).not.toBeInTheDocument();
    unmount();
    mocks.params = new URLSearchParams("section=connections");
    render(<AccountSettings />);
    await screen.findByText("@ellisnorth");
    expect(screen.getByRole("heading", { level: 2, name: accountSettingsCopy.fa.profile })).toBeVisible();
  });
  it("opens the form once for the studio's #creator-profile link and does not reopen it after saving", async () => {
    window.history.replaceState(null, "", "/fa/dashboard/settings#creator-profile");
    Element.prototype.scrollIntoView = vi.fn();
    mocks.get.mockResolvedValue(creator);
    mocks.update.mockResolvedValue({ ...creator, bio: "A new biography that is long enough." });
    render(<AccountSettings />);
    const form = await screen.findByRole("form", { name: copy.fa.creatorHub.editTitle });
    fireEvent.change(within(form).getByLabelText(copy.fa.creatorHub.bio), { target: { value: "A new biography that is long enough." } });
    fireEvent.click(within(form).getByRole("button", { name: copy.fa.creatorHub.save }));
    expect(await screen.findByText(copy.fa.creatorHub.saved)).toBeVisible();
    expect(screen.queryByRole("form", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  });
  it("shows revoked creator access instead of an editable form", async () => {
    mocks.get.mockResolvedValue({ ...creator, accessActive: false });
    render(<AccountSettings />);
    expect(await screen.findByText(copy.fa.creatorHub.accessRevoked)).toBeVisible();
    expect(screen.queryByRole("form", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
  });
  it("points a reader without a creator profile to the studio to create one", async () => {
    mocks.get.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "missing"));
    render(<AccountSettings />);
    expect(await screen.findByRole("link", { name: copy.fa.creatorHub.title })).toHaveAttribute("href", "/fa/dashboard/studio");
    expect(screen.queryByRole("form", { name: copy.fa.creatorHub.editTitle })).not.toBeInTheDocument();
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
    mocks.params = new URLSearchParams("section=account");
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
