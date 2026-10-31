import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/lib/account-api", () => ({ getEmailPreferences: mocks.read, setEmailPreferences: mocks.write }));
const { ApiError } = await import("@/lib/api");
const { AccountPreferences } = await import("./account-preferences");
const { accountPreferencesCopy } = await import("./account-preferences-copy");
const text = accountPreferencesCopy.en;

const ready = (newsletter: boolean, moderation: boolean) => ({ newsletter, moderation });

describe("email preferences", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it("shows both preferences and saves a newsletter change", async () => {
    mocks.read.mockResolvedValue(ready(true, true));
    mocks.write.mockResolvedValue(ready(false, true));
    render(<AccountPreferences />);
    expect(screen.getByText(text.loading)).toBeVisible();
    const newsletter = await screen.findByRole("switch", { name: text.newsletter });
    const moderation = screen.getByRole("switch", { name: text.moderation });
    expect(newsletter).toHaveAttribute("aria-checked", "true");
    expect(moderation).toHaveAttribute("aria-checked", "true");
    expect(newsletter).toHaveAccessibleDescription(text.newsletterHelp);
    expect(moderation).toHaveAccessibleDescription(text.moderationHelp);
    expect(screen.getAllByText(text.on)).toHaveLength(2);

    fireEvent.click(newsletter);

    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith({ newsletter: false }));
    expect(await screen.findByRole("status")).toHaveTextContent(text.unsubscribed);
    expect(newsletter).toHaveAttribute("aria-checked", "false");
  });

  it("saves the moderation email switch independently", async () => {
    mocks.read.mockResolvedValue(ready(true, true));
    mocks.write.mockResolvedValue(ready(true, false));
    render(<AccountPreferences />);
    const moderation = await screen.findByRole("switch", { name: text.moderation });

    fireEvent.click(moderation);

    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith({ moderation: false }));
    expect(await screen.findByRole("status")).toHaveTextContent(text.moderationDisabled);
    expect(screen.getByRole("switch", { name: text.newsletter })).toHaveAttribute("aria-checked", "true");
    expect(moderation).toHaveAttribute("aria-checked", "false");
  });

  it("recovers a failed load with Retry and never guesses the state", async () => {
    let settle!: (value: { newsletter: boolean; moderation: boolean }) => void;
    mocks.read.mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE", "fixture")).mockReturnValueOnce(new Promise((resolve) => { settle = resolve; }));
    render(<AccountPreferences />);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.loadError);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: text.retry }));

    expect(screen.getByText(text.loading)).toBeVisible();
    settle(ready(false, true));
    expect(await screen.findByRole("switch", { name: text.newsletter })).toHaveAttribute("aria-checked", "false");
    expect(mocks.read).toHaveBeenCalledTimes(2);
  });

  it("keeps a switch where it was when the save fails and explains why", async () => {
    mocks.read.mockResolvedValue(ready(false, true));
    mocks.write.mockRejectedValueOnce(new ApiError(429, "RATE_LIMITED", "fixture")).mockRejectedValueOnce(Object.assign(new Error("offline")));
    render(<AccountPreferences />);
    const newsletter = await screen.findByRole("switch", { name: text.newsletter });
    expect(newsletter).toHaveAttribute("aria-checked", "false");

    fireEvent.click(newsletter);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.rateLimited);
    expect(newsletter).toHaveAttribute("aria-checked", "false");
    expect(mocks.write).toHaveBeenLastCalledWith({ newsletter: true });

    fireEvent.click(newsletter);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.failed);
    expect(newsletter).toHaveAttribute("aria-checked", "false");
  });

  it("disables both switches while a save is in flight", async () => {
    mocks.read.mockResolvedValue(ready(true, true));
    let settle!: (value: { newsletter: boolean; moderation: boolean }) => void;
    mocks.write.mockReturnValue(new Promise((resolve) => { settle = resolve; }));
    render(<AccountPreferences />);
    const newsletter = await screen.findByRole("switch", { name: text.newsletter });
    const moderation = screen.getByRole("switch", { name: text.moderation });

    fireEvent.click(newsletter);
    await waitFor(() => expect(newsletter).toBeDisabled());
    expect(moderation).toBeDisabled();
    expect(screen.getByText(text.saving)).toBeVisible();
    settle(ready(false, true));
    await waitFor(() => expect(newsletter).not.toBeDisabled());
  });
});
