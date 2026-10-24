import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const getQueue = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, marketplaceRoles: ["moderator"] as string[] }));
const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));

vi.mock("./moderation-api", async (importOriginal) => ({ ...await importOriginal<typeof import("./moderation-api")>(), getModerationQueue: getQueue }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  usePathname: () => "/dashboard/moderation",
  useSearchParams: () => navigation.params,
}));

const { ApiError } = await import("@/lib/api");
const { ModerationQueue } = await import("./moderation-queue");
const { LocaleProvider } = await import("@/lib/locale-context");

const listing = {
  id: "product-1", slug: "review-skill", name: "Review Skill", type: "Skill", typeKey: "skill", state: "submitted", version: 3,
  published: false, creator: { name: "Creator", handle: "creator" }, selfOwned: false, proposedRevision: 2,
  releaseVersion: "1.1.0", sourceResolved: true, ownershipVerified: false, communityRequestCount: 1, updatedAt: "2026-09-17T08:00:00.000Z",
  capabilities: [{ capability: "secret_access", required: true }, { capability: "filesystem_read", required: false }],
};

function renderQueue() {
  return render(<LocaleProvider locale="en" messages={copy.en}><ModerationQueue /></LocaleProvider>);
}

describe("ModerationQueue", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.loading = false;
    session.marketplaceRoles = ["moderator"];
    navigation.params = new URLSearchParams();
    getQueue.mockResolvedValue({
      data: { summary: { submitted: 1, approved: 0, awaitingAction: 1 }, listings: [listing] },
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
  });

  it("links to the preview from the listing's own name, one link per listing", async () => {
    renderQueue();
    const link = await screen.findByRole("link", { name: "Review Skill" });
    expect(link).toHaveAttribute("href", "/dashboard/moderation/listings/product-1");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows what each listing declares it touches and flags what needs a closer look", async () => {
    renderQueue();
    expect(await screen.findByText("Access secrets")).toBeInTheDocument();
    expect(screen.getByText("Read files")).toBeInTheDocument();
    expect(screen.getAllByText("Needs a closer look")).toHaveLength(1);
  });

  it("says when a listing declares no permissions instead of implying it is safe", async () => {
    getQueue.mockResolvedValue({
      data: { summary: { submitted: 1, approved: 0, awaitingAction: 1 }, listings: [{ ...listing, capabilities: [] }] },
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
    renderQueue();
    expect(await screen.findByText("Declares no permissions")).toBeInTheDocument();
    expect(screen.queryByText("Needs a closer look")).not.toBeInTheDocument();
  });

  it("shows source and ownership checks as separate, plainly worded facts", async () => {
    renderQueue();
    await screen.findByRole("link", { name: "Review Skill" });
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("Passed")).not.toBeInTheDocument();
  });

  it("reads its state, search and page from the URL", async () => {
    navigation.params = new URLSearchParams("state=published&q=review&page=2");
    renderQueue();
    await screen.findByRole("link", { name: "Review Skill" });
    expect(getQueue).toHaveBeenCalledWith({ state: "published", q: "review", page: 2, limit: 24 }, expect.any(AbortSignal));
  });

  it("falls back to the default queue for a state the API does not know", async () => {
    navigation.params = new URLSearchParams("state=foo");
    renderQueue();
    await screen.findByRole("link", { name: "Review Skill" });
    expect(getQueue).toHaveBeenCalledWith(expect.objectContaining({ state: "review" }), expect.any(AbortSignal));
  });

  it("shows the real reason the queue could not load", async () => {
    getQueue.mockRejectedValue(new ApiError(403, "MARKETPLACE_ROLE_REQUIRED", "A moderator role is required"));
    renderQueue();
    expect(await screen.findByRole("alert")).toHaveTextContent("A moderator role is required");
  });

  it("writes a changed state to the URL and resets the page", async () => {
    navigation.params = new URLSearchParams("page=3");
    renderQueue();
    fireEvent.change(await screen.findByLabelText("Queue state"), { target: { value: "published" } });
    expect(navigation.push).toHaveBeenCalledWith("/dashboard/moderation?state=published", { scroll: false });
  });

  it("carries the queue's filters to the preview so Back returns to them", async () => {
    navigation.params = new URLSearchParams("state=approved");
    renderQueue();
    expect(await screen.findByRole("link", { name: "Review Skill" })).toHaveAttribute("href", "/dashboard/moderation/listings/product-1?from=state%3Dapproved");
  });

  it("does not call the queue API without a staff marketplace role", () => {
    session.marketplaceRoles = ["creator"];
    renderQueue();
    expect(screen.getByRole("alert")).toHaveTextContent("An active community moderator or administrator role is required.");
    expect(getQueue).not.toHaveBeenCalled();
  });
});
