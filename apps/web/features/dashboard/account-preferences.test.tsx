import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/lib/account-api", () => ({ getNewsletterPreference: mocks.read, setNewsletterPreference: mocks.write }));
const { ApiError } = await import("@/lib/api");
const { AccountPreferences } = await import("./account-preferences");
const { accountPreferencesCopy } = await import("./account-preferences-copy");
const text = accountPreferencesCopy.en;

describe("email preferences", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it("shows the reader's current newsletter state and saves a change", async () => {
    mocks.read.mockResolvedValue({ newsletter: true });
    mocks.write.mockResolvedValue({ newsletter: false });
    render(<AccountPreferences />);
    expect(screen.getByText(text.loading)).toBeVisible();
    const toggle = await screen.findByRole("switch", { name: text.newsletter });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAccessibleDescription(text.newsletterHelp);
    expect(screen.getByText(text.on)).toBeVisible();

    fireEvent.click(toggle);

    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith(false));
    expect(await screen.findByRole("status")).toHaveTextContent(text.unsubscribed);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(text.off)).toBeVisible();
  });

  it("recovers a failed load with Retry and never guesses the state", async () => {
    let settle!: (value: { newsletter: boolean }) => void;
    mocks.read.mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE", "fixture")).mockReturnValueOnce(new Promise((resolve) => { settle = resolve; }));
    render(<AccountPreferences />);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.loadError);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: text.retry }));

    expect(screen.getByText(text.loading)).toBeVisible();
    settle({ newsletter: false });
    expect(await screen.findByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(mocks.read).toHaveBeenCalledTimes(2);
  });

  it("keeps the switch where it was when the save fails and explains why", async () => {
    mocks.read.mockResolvedValue({ newsletter: false });
    mocks.write.mockRejectedValueOnce(new ApiError(429, "RATE_LIMITED", "fixture")).mockRejectedValueOnce(Object.assign(new Error("offline")));
    render(<AccountPreferences />);
    const toggle = await screen.findByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.rateLimited);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(mocks.write).toHaveBeenLastCalledWith(true);

    fireEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.failed);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("disables the switch while a save is in flight", async () => {
    mocks.read.mockResolvedValue({ newsletter: true });
    let settle!: (value: { newsletter: boolean }) => void;
    mocks.write.mockReturnValue(new Promise((resolve) => { settle = resolve; }));
    render(<AccountPreferences />);
    const toggle = await screen.findByRole("switch");

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toBeDisabled());
    expect(screen.getByText(text.saving)).toBeVisible();
    settle({ newsletter: false });
    await waitFor(() => expect(toggle).not.toBeDisabled());
  });
});
