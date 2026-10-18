import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmEmailVerification = vi.hoisted(() => vi.fn());
const requestEmailVerification = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const logout = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, email: "reader@example.com", emailVerified: false, refresh }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, confirmEmailVerification, requestEmailVerification, logout };
});
vi.mock("./marketplace-session", () => ({
  useMarketplaceSession: () => session,
}));
vi.mock("@/lib/locale-context", () => ({
  useLocale: () => ({
    locale: "en",
    t: {
      verificationChecking: "Verifying your email…", verificationComplete: "Your email is verified.",
      verificationInvalid: "Invalid link", verificationError: "Service unavailable", verificationInstructions: "Check your inbox",
      verifyEmail: "Verify your email", verificationSent: "Message queued", resendVerification: "Resend verification",
      returnToAccount: "Return to account", signIn: "Sign in", signOut: "Sign out", wait: "Please wait…",
    },
  }),
}));

const { EmailVerification } = await import("./email-verification");

describe("EmailVerification", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  beforeEach(() => {
    vi.clearAllMocks();
    session.emailVerified = false;
    window.history.replaceState({}, "", "/account/verify-email#token=verification.signature");
    confirmEmailVerification.mockResolvedValue({ data: { verified: true } });
    refresh.mockResolvedValue(undefined);
  });

  it("submits the fragment token, removes it from the URL, and reports success", async () => {
    render(<EmailVerification />);
    await waitFor(() => expect(confirmEmailVerification).toHaveBeenCalledWith("verification.signature"));
    expect(window.location.hash).toBe("");
    expect(await screen.findByText("Your email is verified.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("hides the inbox box and returns accepted sessions to the dashboard", async () => {
    session.emailVerified = true;
    render(<EmailVerification />);
    expect(screen.queryByRole("heading", { name: "Verify your email" })).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(confirmEmailVerification).not.toHaveBeenCalled();
  });

  it("allows another resend after the server cooldown", async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/account/verify-email");
    requestEmailVerification.mockResolvedValue({ data: { accepted: true } });
    render(<EmailVerification />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Resend verification" })); });
    expect(screen.getByText("Message queued")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend verification" })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(screen.getByRole("button", { name: "Resend verification" })).toBeEnabled();
  });

  it("identifies the current account and lets it sign out of the gate", async () => {
    window.history.replaceState({}, "", "/account/verify-email");
    logout.mockResolvedValue(undefined);
    render(<EmailVerification />);
    expect(screen.getByText("reader@example.com")).toHaveAttribute("dir", "ltr");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
