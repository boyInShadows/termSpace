import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ options: vi.fn(), types: vi.fn(), get: vi.fn(), create: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getMarketplaceDraftOptions: mocks.options, getMarketplaceItemTypes: mocks.types, getCreatorDraft: mocks.get, createCreatorDraft: mocks.create }));
const { CreatorDraftEditor } = await import("./creator-draft-editor");

describe("draft editor navigation and recovery", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.options.mockResolvedValue({ categories: [], communities: [], platforms: [] });
    mocks.types.mockResolvedValue([{ key: "skill", en: "Skill", fa: "مهارت" }]);
  });

  it("keeps dirty input when an internal exit is cancelled and allows discard", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<CreatorDraftEditor />);
    const slug = await screen.findByRole("textbox", { name: copy.en.creatorDraft.slug });
    fireEvent.change(slug, { target: { value: "retain-this-draft" } });
    const exit = screen.getByRole("link", { name: copy.en.creatorDraft.cancel });
    const cancelled = new MouseEvent("click", { bubbles: true, cancelable: true });
    exit.dispatchEvent(cancelled);
    expect(cancelled.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledWith(copy.en.creatorDraft.discardChanges);
    expect(slug).toHaveValue("retain-this-draft");
    confirm.mockReturnValue(true);
    // Stop the test browser navigation after the capture-phase guard has run.
    exit.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(exit);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("keeps context on load failure and retries without refreshing the page", async () => {
    mocks.get.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ id: "draft-1", version: 1, draft: { content: {} } });
    render(<CreatorDraftEditor productId="draft-1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.en.creatorDraft.loadError);
    expect(screen.getByRole("heading", { name: copy.en.creatorDraft.editTitle })).toBeVisible();
    expect(screen.getByRole("link", { name: copy.en.creatorDraft.back })).toHaveAttribute("href", "/dashboard/studio");
    fireEvent.click(screen.getByRole("button", { name: copy.en.creatorHub.retry }));
    await screen.findByRole("textbox", { name: copy.en.creatorDraft.slug });
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });
});
