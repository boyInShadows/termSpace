import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmPasswordReset = vi.hoisted(() => vi.fn());
const logout = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ email: undefined as string | undefined, refresh }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, confirmPasswordReset, logout };
});
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({
  useLocale: () => ({
    locale: "en",
    t: {
      resetPasswordTitle: "Choose a new password", resetPasswordIntro: "Enter a new password for your account.",
      newPassword: "New password", confirmPassword: "Confirm password", savePassword: "Save new password",
      passwordMismatch: "Passwords do not match.", passwordUnchanged: "Choose a different password.",
      invalidResetLink: "This reset link is invalid or expired.", requestNewLink: "Request a new link",
      signedInAsOther: "You're signed in as another account.", logOutAndContinue: "Log out and continue",
      serviceError: "Service unavailable", wait: "Please wait…",
    },
  }),
}));

const { PasswordReset } = await import("./password-reset");

describe("PasswordReset", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = undefined;
    refresh.mockResolvedValue(undefined);
    confirmPasswordReset.mockResolvedValue({ data: { reset: true } });
    window.history.replaceState({}, "", "/account/reset-password#token=reset.signature");
  });

  function fill(password = "new-password", confirmation = "new-password") {
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: confirmation } });
  }

  it("refuses to render a form without a link token", async () => {
    window.history.replaceState({}, "", "/account/reset-password");
    render(<PasswordReset />);
    expect(await screen.findByText("This reset link is invalid or expired.")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("checks the confirmation before calling the API", async () => {
    render(<PasswordReset />);
    fill("new-password", "different-password");
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(confirmPasswordReset).not.toHaveBeenCalled();
  });

  it("saves the password, refreshes the session and opens settings", async () => {
    render(<PasswordReset />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() => expect(confirmPasswordReset).toHaveBeenCalledWith("reset.signature", "new-password"));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/settings?section=account"));
    expect(refresh).toHaveBeenCalled();
    expect(window.location.hash).toBe("");
  });

  it("asks a reader signed in as another account to log out, then keeps the form", async () => {
    const { ApiError } = await import("@/lib/api");
    session.email = "other@example.com";
    confirmPasswordReset.mockRejectedValueOnce(new ApiError(409, "SIGNED_IN_AS_OTHER_ACCOUNT", "Sign out first"));
    logout.mockResolvedValue(undefined);
    render(<PasswordReset />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByText(/signed in as another account/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Log out and continue" }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
  });

  it("reports an unchanged password without losing the link", async () => {
    const { ApiError } = await import("@/lib/api");
    confirmPasswordReset.mockRejectedValueOnce(new ApiError(400, "PASSWORD_UNCHANGED", "Choose a different password."));
    render(<PasswordReset />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a different password.");
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
  });
});
