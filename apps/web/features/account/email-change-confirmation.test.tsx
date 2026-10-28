import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), refresh: vi.fn(), locale: "en" as "en" | "fa" }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: mocks.locale, t: copy[mocks.locale] }) }));
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/lib/account-api", () => ({ confirmEmailChange: mocks.confirm }));
const { ApiError } = await import("@/lib/api");
const { EmailChangeConfirmation } = await import("./email-change-confirmation");
const { emailChangeCopy } = await import("./email-change-copy");

function open(hash: string) {
  window.history.replaceState(null, "", `/account/confirm-email${hash}`);
}

describe("email change confirmation page", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.locale = "en"; mocks.refresh.mockResolvedValue(undefined); });

  it("asks for the emailed link when there is no token", () => {
    open("");
    render(<EmailChangeConfirmation />);
    expect(screen.getByText(emailChangeCopy.en.noToken)).toBeVisible();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: emailChangeCopy.en.signIn })).toHaveAttribute("href", "/account");
  });

  it("confirms, removes the token from the address bar and tells the reader to sign in again", async () => {
    mocks.confirm.mockResolvedValue({ data: { changed: true } });
    open("#token=abc.def");
    render(<EmailChangeConfirmation />);
    expect(await screen.findByText(emailChangeCopy.en.changed)).toBeVisible();
    expect(mocks.confirm).toHaveBeenCalledWith("abc.def");
    expect(window.location.hash).toBe("");
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: emailChangeCopy.en.signIn })).toHaveAttribute("href", "/account");
  });

  it("sends the Persian reader to the Persian sign-in", async () => {
    mocks.locale = "fa";
    mocks.confirm.mockResolvedValue({ data: { changed: true } });
    open("#token=abc.def");
    render(<EmailChangeConfirmation />);
    expect(await screen.findByText(emailChangeCopy.fa.changed)).toBeVisible();
    expect(screen.getByRole("link", { name: emailChangeCopy.fa.signIn })).toHaveAttribute("href", "/fa/account");
  });

  it.each([
    ["an invalid or expired link", new ApiError(400, "INVALID_OR_EXPIRED_EMAIL_CHANGE", "no"), emailChangeCopy.en.invalid],
    ["an address that was taken meanwhile", new ApiError(409, "EMAIL_UNAVAILABLE", "taken"), emailChangeCopy.en.unavailable],
    ["a server failure", new ApiError(503, "API_ERROR", "down"), emailChangeCopy.en.confirmFailed],
    ["an unreachable server", new TypeError("Failed to fetch"), emailChangeCopy.en.confirmFailed],
  ])("explains %s and points back to Settings", async (_name, failure, message) => {
    mocks.confirm.mockRejectedValue(failure);
    open("#token=abc.def");
    render(<EmailChangeConfirmation />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
    expect(screen.getByRole("link", { name: emailChangeCopy.en.openSettings })).toHaveAttribute("href", "/dashboard/settings");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
