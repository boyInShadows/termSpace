import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";
import { copy } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { AccountSecurity } from "./account-security";
import { accountSecurityCopy } from "./account-security-copy";

const mocks = vi.hoisted(() => ({ profile: vi.fn(), change: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getReaderProfile: mocks.profile, changeReaderPassword: mocks.change }));
vi.mock("@/lib/account-api", () => ({ revokeOtherSessions: mocks.revoke }));
const profile = { email: "reader@e2e.test", createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false, emailVerified: true };

function fill(current = "fixture-current", next = "fixture-next-password", confirm = next) {
  fireEvent.change(screen.getByLabelText(accountSecurityCopy.en.currentPassword), { target: { value: current } });
  fireEvent.change(screen.getByLabelText(copy.en.newPassword), { target: { value: next } });
  fireEvent.change(screen.getByLabelText(copy.en.confirmPassword), { target: { value: confirm } });
}

describe("account security", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.profile.mockResolvedValue(profile); mocks.change.mockResolvedValue({ data: { updated: true } }); });

  it.each(["en", "fa"] as const)("loads sign-in details and a bounded password form (%s)", async (locale) => {
    render(<LocaleProvider locale={locale} messages={copy[locale]}><AccountSecurity /></LocaleProvider>);
    const field = await screen.findByLabelText(accountSecurityCopy[locale].currentPassword);
    expect(field).toHaveAttribute("autocomplete", "current-password");
    expect(field).toHaveAttribute("maxlength", "128");
    expect(screen.getByLabelText(copy[locale].newPassword)).toHaveAttribute("minlength", "8");
    expect(screen.getByText(accountSecurityCopy[locale].passwordSignIn)).toBeVisible();
    expect(screen.getByText(accountSecurityCopy[locale].intro)).toBeVisible();
    expect(document.querySelector("time")).toHaveAttribute("datetime", profile.createdAt);
  });

  it("keeps the form unavailable until a failed profile load is retried", async () => {
    mocks.profile.mockRejectedValueOnce(new Error("offline"));
    render(<AccountSecurity />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(accountSecurityCopy.en.loadError);
    fireEvent.click(screen.getByRole("button", { name: copy.en.dashboardHome.retry }));
    expect(await screen.findByLabelText(accountSecurityCopy.en.currentPassword)).toBeVisible();
  });

  it("does not offer password setup for a Google-only account", async () => {
    mocks.profile.mockResolvedValue({ ...profile, hasPassword: false, connectedGoogle: true });
    render(<AccountSecurity />);
    expect(await screen.findByText(accountSecurityCopy.en.googleSignIn)).toBeVisible();
    expect(screen.getByText(accountSecurityCopy.en.noPasswordIntro)).toBeVisible();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("reports a password-and-Google account without hiding its password form", async () => {
    mocks.profile.mockResolvedValue({ ...profile, connectedGoogle: true });
    render(<AccountSecurity />);
    expect(await screen.findByText(accountSecurityCopy.en.bothSignIn)).toBeVisible();
    expect(screen.getByRole("form")).toBeVisible();
  });

  it("rejects mismatched confirmation before calling the API", async () => {
    render(<AccountSecurity />); await screen.findByRole("form");
    fill("fixture-current", "fixture-next-password", "different-password");
    fireEvent.submit(screen.getByRole("form"));
    expect(screen.getByRole("alert")).toHaveTextContent(copy.en.passwordMismatch);
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it.each([
    [new ApiError(401, "INVALID_CURRENT_PASSWORD", "internal message"), accountSecurityCopy.en.invalidCurrent],
    [new ApiError(400, "PASSWORD_UNCHANGED", "internal message"), copy.en.passwordUnchanged],
    [new ApiError(403, "PASSWORD_SETUP_REQUIRES_REAUTH", "internal message"), accountSecurityCopy.en.noPasswordIntro],
    [new ApiError(429, "RATE_LIMIT", "internal message"), accountSecurityCopy.en.rateLimited],
    [new Error("offline"), copy.en.serviceError],
  ])("preserves input and enables retry after %s", async (cause, message) => {
    mocks.change.mockRejectedValueOnce(cause);
    render(<AccountSecurity />); await screen.findByRole("form"); fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText(copy.en.newPassword)).toHaveValue("fixture-next-password");
    expect(screen.getByRole("button", { name: accountSecurityCopy.en.savePassword })).toBeEnabled();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("status")).toHaveTextContent(accountSecurityCopy.en.saved);
  });

  it("submits only current/new passwords once while pending, then clears all fields", async () => {
    let resolve!: (value: unknown) => void;
    mocks.change.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    render(<AccountSecurity />); await screen.findByRole("form"); fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(screen.getByLabelText(copy.en.newPassword)).toBeDisabled();
    fireEvent.submit(screen.getByRole("form"));
    expect(mocks.change).toHaveBeenCalledExactlyOnceWith("fixture-current", "fixture-next-password");
    await act(async () => resolve({ data: { updated: true } }));
    await waitFor(() => expect(screen.getByLabelText(copy.en.newPassword)).toHaveValue(""));
    expect(screen.getByLabelText(accountSecurityCopy.en.currentPassword)).toHaveValue("");
    expect(screen.getByLabelText(copy.en.confirmPassword)).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(accountSecurityCopy.en.saved);
  });
});

describe("sign out other devices", () => {
  const text = accountSecurityCopy.en;
  beforeEach(() => { vi.clearAllMocks(); mocks.profile.mockResolvedValue(profile); });
  const open = async () => {
    render(<LocaleProvider locale="en" messages={copy.en}><AccountSecurity /></LocaleProvider>);
    return screen.findByRole("button", { name: text.signOutOthers });
  };

  it("explains that this device stays signed in and reports how it went", async () => {
    mocks.revoke.mockResolvedValue({ revoked: 2 });
    const button = await open();
    expect(button).toHaveAccessibleDescription(text.signOutOthersHelp);
    fireEvent.click(button);
    expect(await screen.findByRole("status")).toHaveTextContent(text.othersSignedOut);
  });

  it("says so when no other device was signed in", async () => {
    mocks.revoke.mockResolvedValue({ revoked: 0 });
    fireEvent.click(await open());
    expect(await screen.findByRole("status")).toHaveTextContent(text.noOtherSessions);
  });

  it("is available to a Google-only account", async () => {
    mocks.profile.mockResolvedValue({ ...profile, hasPassword: false, connectedGoogle: true });
    expect(await open()).toBeEnabled();
  });

  it("ignores a second click while the request is pending", async () => {
    let finish!: (value: { revoked: number }) => void;
    mocks.revoke.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const button = await open();
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: text.signingOutOthers })).toBeDisabled();
    expect(mocks.revoke).toHaveBeenCalledOnce();
    await act(async () => { finish({ revoked: 1 }); });
    expect(await screen.findByRole("button", { name: text.signOutOthers })).toBeEnabled();
  });

  it.each([
    ["an unreachable server", new TypeError("Failed to fetch"), text.requestOffline],
    ["a rate limit", new ApiError(429, "RATE_LIMITED", "slow"), text.rateLimited],
    ["a server failure", new ApiError(503, "API_ERROR", "down"), copy.en.serviceError],
    ["another rejection", new ApiError(403, "FORBIDDEN", "no"), text.signOutOthersFailed],
  ])("names the cause of %s", async (_name, failure, message) => {
    mocks.revoke.mockRejectedValue(failure);
    fireEvent.click(await open());
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});
