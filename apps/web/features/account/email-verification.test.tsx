import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmEmailVerification = vi.hoisted(() => vi.fn());
const requestEmailVerification = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, confirmEmailVerification, requestEmailVerification };
});
vi.mock("./marketplace-session", () => ({
  useMarketplaceSession: () => ({ loading: false, email: "reader@example.com", emailVerified: false, refresh }),
}));
vi.mock("@/lib/locale-context", () => ({
  useLocale: () => ({
    locale: "en",
    t: {
      verificationChecking: "Verifying your email…", verificationComplete: "Your email is verified.",
      verificationInvalid: "Invalid link", verificationError: "Service unavailable", verificationInstructions: "Check your inbox",
      verifyEmail: "Verify your email", verificationSent: "Message queued", resendVerification: "Resend verification",
      returnToAccount: "Return to account", signIn: "Sign in", wait: "Please wait…",
    },
  }),
}));

const { EmailVerification } = await import("./email-verification");

describe("EmailVerification", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  beforeEach(() => {
    vi.clearAllMocks();
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
});
