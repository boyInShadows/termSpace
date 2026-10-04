import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMarketplaceLibrary = vi.hoisted(() => vi.fn());
const requestPasswordReset = vi.hoisted(() => vi.fn());
const confirmPasswordReset = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ email: "reader@example.com" as string | undefined, refresh: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getMarketplaceLibrary,
  requestPasswordReset,
  confirmPasswordReset,
}));
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: {
  account: "Your account", signedInAs: "Signed in as", signOut: "Sign out", signIn: "Sign in", createAccount: "Create account",
  forgotPassword: "Forgot password?", forgotPasswordIntro: "Enter your email", enterResetCode: "Enter reset code", resetCodeIntro: "Enter the code",
  accountIntro: "Account intro", email: "Email", password: "Password", newPassword: "New password", resetCode: "Reset code", wait: "Please wait",
  confirmPassword: "Confirm password", passwordMismatch: "Passwords do not match", invalidCredentials: "Invalid credentials", emailAlreadyRegistered: "Already registered",
  resetCodeInvalid: "Invalid reset code", passwordUnchanged: "Password unchanged",
  sendResetCode: "Send reset code", resetPassword: "Reset password", resetCodeSent: "Code sent", resetComplete: "Password reset complete",
  needAccount: "Register", registered: "Sign in instead", backToSignIn: "Back to sign in", serviceError: "Service unavailable",
} }) }));

const { AccountForm } = await import("./account-form");

describe("marketplace account library", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = "reader@example.com";
    getMarketplaceLibrary.mockResolvedValue({
      data: [{
        acquisitionId: "order-1", acquiredAt: "2026-09-18T10:00:00.000Z",
        product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", type: "Skill", typeKey: "skill", outcome: "Completes a useful task", creator: { name: "Creator", handle: "creator" } },
        release: { id: "release-1", version: "1.0.0", sourceStatus: "verified" }, installationAvailable: true,
      }],
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
  });

  it("shows acquired resources and links back to their gated installation", async () => {
    render(<AccountForm />);
    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View installation" })).toHaveAttribute("href", "/products/owned-skill");
  });
});

describe("password recovery", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = undefined;
    requestPasswordReset.mockResolvedValue({ data: { accepted: true } });
    confirmPasswordReset.mockResolvedValue({ data: { reset: true } });
  });

  it("requests an OTP and resets the password without exposing account existence", async () => {
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset code" }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("reader@example.com"));
    expect(screen.getByRole("status")).toHaveTextContent("Code sent");
    fireEvent.change(screen.getByLabelText("Reset code"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => expect(confirmPasswordReset).toHaveBeenCalledWith("reader@example.com", "123456", "new-password"));
    expect(screen.getByRole("status")).toHaveTextContent("Password reset complete");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});
