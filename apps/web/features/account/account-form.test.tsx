import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestPasswordReset = vi.hoisted(() => vi.fn());
const confirmPasswordReset = vi.hoisted(() => vi.fn());
const login = vi.hoisted(() => vi.fn());
const register = vi.hoisted(() => vi.fn());
const loginWithGoogle = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ email: "reader@example.com" as string | undefined, emailVerified: true, refresh: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ next: "" }));
const router = vi.hoisted(() => ({ replace, refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/account", useSearchParams: () => new URLSearchParams({ next: params.next }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  requestPasswordReset,
  confirmPasswordReset,
  login,
  register,
  loginWithGoogle,
}));
vi.mock("./google-sign-in", () => ({ GoogleSignIn: ({ onCredential, disabled }: { onCredential: (credential: string) => Promise<void>; disabled: boolean }) => <button disabled={disabled} onClick={() => void onCredential("test-google-credential")}>Continue with Google</button> }));
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: {
  account: "Your account", signedInAs: "Signed in as", signOut: "Sign out", signIn: "Log in", createAccount: "Create account",
  forgotPassword: "Forgot password?", forgotPasswordIntro: "Enter your email",
  accountIntro: "Account intro", email: "Email", password: "Password", newPassword: "New password", wait: "Please wait",
  confirmPassword: "Confirm password", passwordMismatch: "Passwords do not match", invalidCredentials: "Invalid credentials",
  checkInbox: "Check your inbox", signupLinkSent: "We've sent a verification link to", signupLinkSentTail: "Open it to finish creating your account.",
  resetLinkSent: "If an account exists for", resetLinkSentTail: "we've sent a password reset link.", closeWindowSafe: "You can safely close this window.",
  sendResetLink: "Send reset link", invalidResetLink: "Invalid reset link",
  needAccount: "New here? Create an account", registered: "Already have an account? Log in", backToSignIn: "Back to log in", serviceError: "Service unavailable",
  verifyEmail: "Verify your email", verificationInstructions: "Check your inbox",
} }) }));

const { AccountForm } = await import("./account-form");

describe("signed-in account", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = "reader@example.com";
    session.emailVerified = true;
  });

  it("points to the dashboard library instead of embedding it", () => {
    render(<AccountForm />);
    expect(screen.getByRole("link", { name: "Open acquired library" })).toHaveAttribute("href", "/dashboard/library");
    expect(screen.queryByRole("heading", { name: "Owned Skill" })).not.toBeInTheDocument();
  });

  it("keeps a verification link available to returning unverified readers", () => {
    session.emailVerified = false;
    render(<AccountForm />);
    expect(screen.getByRole("link", { name: "Verify your email" })).toHaveAttribute("href", "/account/verify-email");
  });
});

describe("password sign-in and signup", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = undefined;
    session.refresh.mockResolvedValue(undefined);
    params.next = "";
    login.mockResolvedValue({});
    register.mockResolvedValue({ data: { accepted: true } });
    loginWithGoogle.mockResolvedValue({});
  });

  function credentials() {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "correct-password" } });
  }

  it("signs in and returns to the requested local page", async () => {
    params.next = "/dashboard?tab=listings";
    render(<AccountForm />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(params.next));
    expect(login).toHaveBeenCalledWith("reader@example.com", "correct-password");
    expect(session.refresh).toHaveBeenCalled();
  });

  it("starts onboarding after a new password account signs in", async () => {
    params.next = "/dashboard/library";
    login.mockResolvedValueOnce({ data: { authenticated: true, user: { onboardingRequired: true } } });
    render(<AccountForm />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
  });

  it("starts onboarding after a new Google account signs in", async () => {
    loginWithGoogle.mockResolvedValueOnce({ data: { authenticated: true, user: { onboardingRequired: true } } });
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
  });

  it.each(["//evil.example", "/\\evil.example", "/\n/evil.example", "https://evil.example"])("keeps the redirect on this site for %j", async (next) => {
    params.next = next;
    render(<AccountForm />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("checks password confirmation, then replaces the form with the inbox message", async () => {
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
    credentials();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(register).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(register).toHaveBeenCalledWith("reader@example.com", "correct-password"));
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText(/reader@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/You can safely close this window/)).toBeInTheDocument();
    // The form and its inputs are gone, and no session was started.
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(session.refresh).not.toHaveBeenCalled();
  });

  it("reports bad credentials and permits retry", async () => {
    const { ApiError } = await import("@/lib/api");
    login.mockRejectedValueOnce(new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password"));
    render(<AccountForm />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("signs in through Google and preserves the requested destination", async () => {
    params.next = "/dashboard";
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(loginWithGoogle).toHaveBeenCalledWith("test-google-credential");
    expect(session.refresh).toHaveBeenCalled();
  });

  it("shows a Google credential rejection and keeps sign-in available", async () => {
    const { ApiError } = await import("@/lib/api");
    loginWithGoogle.mockRejectedValueOnce(new ApiError(401, "INVALID_GOOGLE_CREDENTIAL", "Google sign-in could not be verified"));
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Google sign-in could not be verified");
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
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

  it("sends the reset link and replaces the form with the inbox message", async () => {
    render(<AccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("reader@example.com"));
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText(/If an account exists for/)).toBeInTheDocument();
    expect(screen.getByText(/You can safely close this window/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Reset code")).not.toBeInTheDocument();
    expect(confirmPasswordReset).not.toHaveBeenCalled();
  });
});
