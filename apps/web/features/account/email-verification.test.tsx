import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmEmailVerification = vi.hoisted(() => vi.fn());
const requestEmailVerification = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const logout = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, identityLoading: false, email: "reader@example.com" as string | undefined, emailVerified: false, refresh }));

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
      returnToAccount: "Return to account", signIn: "Log in", signOut: "Sign out", wait: "Please wait…",
      signedInAsOther: "You're signed in as another account.", logOutAndContinue: "Log out and continue",
    },
  }),
}));

const { EmailVerification } = await import("./email-verification");

describe("EmailVerification", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = "reader@example.com";
    session.emailVerified = false;
    window.history.replaceState({}, "", "/account/verify-email#token=verification.signature");
    confirmEmailVerification.mockResolvedValue({ data: { verified: true, user: { onboardingRequired: true } } });
    refresh.mockResolvedValue(undefined);
  });

  it("submits the fragment token, removes it from the URL, and opens onboarding", async () => {
    render(<EmailVerification />);
    await waitFor(() => expect(confirmEmailVerification).toHaveBeenCalledWith("verification.signature"));
    expect(window.location.hash).toBe("");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
    expect(refresh).toHaveBeenCalled();
  });

  it("sends an already verified account to its account page when there is no link", async () => {
    session.emailVerified = true;
    window.history.replaceState({}, "", "/account/verify-email");
    render(<EmailVerification />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/account"));
    expect(confirmEmailVerification).not.toHaveBeenCalled();
  });

  it("asks a signed-in reader for a different account to log out, then continues the same link", async () => {
    const { ApiError } = await import("@/lib/api");
    confirmEmailVerification
      .mockRejectedValueOnce(new ApiError(409, "SIGNED_IN_AS_OTHER_ACCOUNT", "Sign out first"))
      .mockResolvedValueOnce({ data: { verified: true, user: { onboardingRequired: true } } });
    logout.mockResolvedValue(undefined);
    render(<EmailVerification />);
    expect(await screen.findByText(/signed in as another account/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Log out and continue" }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
    expect(confirmEmailVerification).toHaveBeenCalledTimes(2);
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
