import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { creatorWorkspace } from "./workspace-copy";

const mocks = vi.hoisted(() => ({ options: vi.fn(), types: vi.fn(), get: vi.fn(), create: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "creator@example.test" }) }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getMarketplaceDraftOptions: mocks.options, getMarketplaceItemTypes: mocks.types, getCreatorDraft: mocks.get, createCreatorDraft: mocks.create }));
const { CreatorDraftEditor } = await import("./creator-draft-editor");

describe("draft editor navigation and recovery", { timeout: 15_000 }, () => {
  it("keeps Next on an invalid current step and exposes adjacent field feedback", async () => {
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const name = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toBeVisible();
    expect(name).toHaveAttribute("aria-invalid", "true");
    const descriptionId = name.getAttribute("aria-describedby")!.split(" ").at(-1)!;
    expect(document.getElementById(descriptionId)).toHaveTextContent("required");
    expect(window.location.search).not.toBe("?step=2");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("blocks an invalid optional field, then clears it without showing future-step errors", async () => {
    mocks.options.mockResolvedValue({ categories: [{ slug: "development", name: "Development" }], communities: [], platforms: [{ key: "codex" }] });
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    fireEvent.input(await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn }), { target: { value: "Review Tool" } });
    fireEvent.change(screen.getByRole("combobox", { name: copy.en.creatorDraft.category }), { target: { value: "development" } });
    fireEvent.change(screen.getByRole("textbox", { name: copy.en.creatorDraft.outcomeEn }), { target: { value: "Reviews changes" } });
    fireEvent.change(screen.getByRole("textbox", { name: copy.en.creatorDraft.descriptionEn }), { target: { value: "Explains changes carefully" } });
    fireEvent.click(screen.getByText(creatorWorkspace.en.creatorDraft.moreAbout));
    const icon = screen.getByRole("textbox", { name: copy.en.creatorDraft.icon });
    fireEvent.change(icon, { target: { value: "not-a-url" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(icon).toHaveFocus());
    expect(icon).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(icon, { target: { value: "" } });
    await waitFor(() => expect(icon).not.toHaveAttribute("aria-invalid"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.projectUrl })).not.toHaveAttribute("aria-invalid");
    expect(window.location.search).toBe("?step=2");
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState(null, "", "/dashboard/studio/listings/new");
    Element.prototype.scrollIntoView = vi.fn();
    mocks.options.mockResolvedValue({ categories: [], communities: [], platforms: [] });
    mocks.types.mockResolvedValue([{ key: "skill", en: "Skill", fa: "مهارت" }]);
  });

  it("shows one of four freely navigable steps and retains hidden input", async () => {
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const slug = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    fireEvent.change(slug, { target: { value: "keep-across-steps" } });
    fireEvent.click(screen.getByRole("button", { name: /^Source & install —/ }));
    expect(slug).not.toBeVisible();
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.installationInstructions })).toBeVisible();
    expect(window.location.search).toBe("?step=2");
    fireEvent.click(screen.getByRole("button", { name: /^About —/ }));
    expect(slug).toHaveValue("keep-across-steps");
    expect(slug).toBeVisible();
  });

  it("saves an incomplete draft locally and resumes at the saved step", async () => {
    const first = render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const slug = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    fireEvent.change(slug, { target: { value: "unfinished-work" } });
    fireEvent.click(screen.getByRole("button", { name: /^Source & install —/ }));
    fireEvent.change(screen.getByRole("textbox", { name: copy.en.creatorDraft.version }), { target: { value: "1.2.0" } });
    fireEvent.click(screen.getByRole("button", { name: "Save for later" }));
    expect(screen.getByText(creatorWorkspace.en.creatorDraft.localSaved)).toBeVisible();
    expect(mocks.create).not.toHaveBeenCalled();
    first.unmount();
    window.history.replaceState(null, "", "/dashboard/studio/listings/new");
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    await screen.findByText(creatorWorkspace.en.creatorDraft.localRestored);
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.version })).toHaveValue("1.2.0");
    fireEvent.click(screen.getByRole("button", { name: /^About —/ }));
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.nameEn })).toHaveValue("unfinished-work");
  });

  it("retains dirty work and the navigation guard when browser storage fails", async () => {
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    fireEvent.change(await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn }), { target: { value: "keep-on-failure" } });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Save for later" }));
    expect(screen.getByRole("alert")).toHaveTextContent(creatorWorkspace.en.creatorDraft.localSaveError);
    screen.getByRole("link", { name: copy.en.creatorDraft.cancel }).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(confirm).toHaveBeenCalled();
  });

  it("reveals and focuses an invalid field from another step before saving", async () => {
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const slug = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    fireEvent.click(screen.getByRole("button", { name: /^Review —/ }));
    fireEvent.click(screen.getByRole("button", { name: copy.en.creatorDraft.save }));
    await waitFor(() => expect(slug).toHaveFocus());
    expect(slug).toBeVisible();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("ignores another account's checkpoint and stale account versions", async () => {
    const value = { version: 1, step: 2, type: "skill", sourceKind: "npm", customLicense: false, fields: [["slug", "old-version"]] };
    localStorage.setItem("termspace:draft:other%40example.test:new", JSON.stringify(value));
    const first = render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    expect(await screen.findByRole("textbox", { name: copy.en.creatorDraft.slug })).toHaveValue("");
    first.unmount();
    localStorage.setItem("termspace:draft:creator%40example.test:draft-1", JSON.stringify(value));
    mocks.get.mockResolvedValue({ id: "draft-1", version: 2, draft: { content: { listing: { slug: "account-version" } } } });
    render(<CreatorDraftEditor productId="draft-1" messages={copy.en.creatorDraft} />);
    await screen.findByText(creatorWorkspace.en.creatorDraft.localStale);
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.slug })).toHaveValue("account-version");
  });

  it("keeps dirty input when an internal exit is cancelled and allows discard", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const slug = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
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
    render(<CreatorDraftEditor productId="draft-1" messages={copy.en.creatorDraft} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.en.creatorDraft.loadError);
    expect(screen.getByRole("heading", { name: copy.en.creatorDraft.editTitle })).toBeVisible();
    expect(screen.getByRole("link", { name: copy.en.creatorDraft.back })).toHaveAttribute("href", "/dashboard/studio");
    fireEvent.click(screen.getByRole("button", { name: copy.en.creatorHub.retry }));
    await screen.findByRole("textbox", { name: copy.en.creatorDraft.slug });
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });

  it("fills the web address from the name until the creator edits it", async () => {
    render(<CreatorDraftEditor messages={copy.en.creatorDraft} />);
    const name = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    const slug = screen.getByRole("textbox", { name: copy.en.creatorDraft.slug });
    fireEvent.input(name, { target: { value: "Code Review Helper" } });
    expect(slug).toHaveValue("code-review-helper");
    fireEvent.input(name, { target: { value: "Code Review Helper 2" } });
    expect(slug).toHaveValue("code-review-helper-2");
    fireEvent.change(slug, { target: { value: "my-own-address" } });
    fireEvent.input(name, { target: { value: "Something else" } });
    expect(slug).toHaveValue("my-own-address");
  });

  it("keeps an existing draft's web address and hides optional fields until asked", async () => {
    mocks.get.mockResolvedValue({ id: "draft-1", version: 1, draft: { content: { listing: { slug: "kept-address", name: { en: "Different Name" } } } } });
    render(<CreatorDraftEditor productId="draft-1" messages={copy.en.creatorDraft} />);
    const name = await screen.findByRole("textbox", { name: copy.en.creatorDraft.nameEn });
    fireEvent.input(name, { target: { value: "Renamed" } });
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.slug })).toHaveValue("kept-address");
    expect(screen.queryByRole("textbox", { name: copy.en.creatorDraft.tags })).not.toBeVisible();
    fireEvent.click(screen.getByText(creatorWorkspace.en.creatorDraft.moreAbout));
    expect(screen.getByRole("textbox", { name: copy.en.creatorDraft.tags })).toBeVisible();
  });
});
