import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/lib/account-api", () => ({ requestEmailChange: mocks.request }));
const { ApiError } = await import("@/lib/api");
const { AccountEmail } = await import("./account-email");
const { emailChangeCopy } = await import("@/features/account/email-change-copy");
const { accountSecurityCopy } = await import("./account-security-copy");
const text = emailChangeCopy.en;
const account = { email: "member@example.test", createdAt: "2026-01-01T00:00:00Z", emailVerified: true };
const withPassword = { status: "ready", profile: { ...account, hasPassword: true, connectedGoogle: false } } as const;
const googleOnly = { status: "ready", profile: { ...account, hasPassword: false, connectedGoogle: true } } as const;

function fill(email = "new@example.test", password = "correct-password") {
  fireEvent.change(screen.getByLabelText(text.newEmailLabel), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(text.passwordLabel), { target: { value: password } });
}

describe("change email", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it("waits for the profile and explains a failed load without a second retry", () => {
    const { rerender } = render(<AccountEmail profile={{ status: "loading" }} />);
    expect(screen.getByText(text.loading)).toBeVisible();
    rerender(<AccountEmail profile={{ status: "error" }} />);
    expect(screen.getByText(text.loadError)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("explains that a Google-only account takes its address from Google", () => {
    render(<AccountEmail profile={googleOnly} />);
    expect(screen.getByText(text.googleManaged)).toBeVisible();
    expect(screen.queryByLabelText(text.newEmailLabel)).not.toBeInTheDocument();
  });

  it("asks for the new address and password, then says a link was sent and clears the form", async () => {
    mocks.request.mockResolvedValue({ data: { accepted: true } });
    render(<AccountEmail profile={withPassword} />);
    expect(screen.getByLabelText(text.newEmailLabel)).toHaveAttribute("dir", "ltr");
    fill();
    fireEvent.click(screen.getByRole("button", { name: text.submit }));
    expect(await screen.findByRole("status")).toHaveTextContent(text.sent);
    expect(mocks.request).toHaveBeenCalledWith("new@example.test", "correct-password");
    expect(screen.getByLabelText(text.newEmailLabel)).toHaveValue("");
    expect(screen.getByLabelText(text.passwordLabel)).toHaveValue("");
  });

  it("ignores a second submit while the first is pending", async () => {
    let finish!: (value: unknown) => void;
    mocks.request.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<AccountEmail profile={withPassword} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: text.submit }));
    expect(await screen.findByRole("button", { name: text.sending })).toBeDisabled();
    expect(mocks.request).toHaveBeenCalledOnce();
    finish({ data: { accepted: true } });
    await waitFor(() => expect(screen.getByRole("button", { name: text.submit })).toBeEnabled());
  });

  it.each([
    ["a wrong password", new ApiError(401, "INVALID_CURRENT_PASSWORD", "no"), text.invalidPassword],
    ["the same address", new ApiError(400, "EMAIL_UNCHANGED", "same"), text.unchanged],
    ["a cooldown", new ApiError(429, "EMAIL_CHANGE_COOLDOWN", "wait"), text.cooldown],
    ["a rate limit", new ApiError(429, "RATE_LIMITED", "slow"), accountSecurityCopy.en.rateLimited],
    ["a server failure", new ApiError(503, "API_ERROR", "down"), copy.en.serviceError],
    ["an invalid address", new ApiError(400, "VALIDATION_ERROR", "bad"), text.invalidEmail],
    ["an unreachable server", new TypeError("Failed to fetch"), text.offline],
    ["another rejection", new ApiError(403, "FORBIDDEN", "no"), text.failed],
  ])("names the cause of %s and keeps what was typed", async (_name, failure, message) => {
    mocks.request.mockRejectedValue(failure);
    render(<AccountEmail profile={withPassword} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: text.submit }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText(text.newEmailLabel)).toHaveValue("new@example.test");
    expect(screen.queryByText(text.sent)).not.toBeInTheDocument();
  });
});
