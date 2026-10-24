import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
const mocks = vi.hoisted(() => ({ get: vi.fn(), reader: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "fa", t: copy.fa }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "creator@example.test", marketplaceRoles: [], refresh: vi.fn() }) }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getOwnedCreatorProfile: mocks.get, getReaderProfile: mocks.reader }));
const { ApiError } = await import("@/lib/api");
const { AccountSettings } = await import("./account-settings");

describe("account profile state", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.reader.mockResolvedValue({ createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false }); });
  it("does not claim a missing profile while loading, recovers a failure and isolates Latin identity", async () => {
    let reject!: (cause: Error) => void;
    mocks.get.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValue({ handle: "ellisnorth" });
    render(<AccountSettings />);
    expect(screen.getAllByRole("status").some((status) => status.textContent === copy.fa.creatorHub.loading)).toBe(true);
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    reject(new Error("offline"));
    await screen.findByRole("alert");
    expect(screen.queryByText(copy.fa.settingsNoCreator)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.fa.creatorHub.retry }));
    expect(await screen.findByText("@ellisnorth")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("creator@example.test")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("link", { name: copy.fa.creatorHub.editTitle })).toHaveAttribute("href", "/fa/dashboard/studio#creator-profile");
  });
  it("reserves the empty profile message for a confirmed missing profile", async () => {
    mocks.get.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "missing"));
    render(<AccountSettings />);
    expect(await screen.findByText(copy.fa.settingsNoCreator)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
