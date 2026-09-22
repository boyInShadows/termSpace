import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getQueue = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, marketplaceRoles: ["moderator"] as string[] }));
const moderation = {
  loading: "Loading moderation", accessDenied: "Access denied", loadError: "Load failed", retry: "Retry",
  eyebrow: "Operations", queueTitle: "Moderation queue", queueIntro: "Review submissions", submitted: "Submitted", approved: "Approved", awaitingAction: "Awaiting action",
  search: "Search", searchPlaceholder: "Search listings", filter: "State", filterReview: "Needs review", filterAll: "All states", apply: "Apply", empty: "Empty",
  revision: "Revision", release: "Release", communities: "Communities", sourceResolved: "Source resolved", ownershipVerified: "Ownership verified",
  checkPassed: "Passed", checkPending: "Pending", selfOwned: "Cannot moderate your own listing", review: "Review submission",
  previousPage: "Previous", nextPage: "Next", pageStatus: "Page {page} of {pages}",
};
const creatorHub = {
  statusDraft: "Draft", statusSubmitted: "Submitted", statusChangesRequested: "Changes requested", statusApproved: "Approved",
  statusPublished: "Published", statusRejected: "Rejected", statusSuspended: "Suspended", statusArchived: "Archived",
};

vi.mock("@/lib/api", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api")>(), getModerationQueue: getQueue }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: { moderation, creatorHub } }) }));

const { ModerationQueue } = await import("./moderation-queue");

describe("ModerationQueue", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.loading = false;
    session.marketplaceRoles = ["moderator"];
    getQueue.mockResolvedValue({
      data: {
        summary: { submitted: 1, approved: 0, awaitingAction: 1 },
        listings: [{
          id: "product-1", slug: "review-skill", name: "Review Skill", type: "Skill", typeKey: "skill", state: "submitted", version: 3,
          published: false, creator: { name: "Creator", handle: "creator" }, selfOwned: false, proposedRevision: 2,
          releaseVersion: "1.1.0", sourceResolved: true, ownershipVerified: false, communityRequestCount: 1, updatedAt: "2026-09-17T08:00:00.000Z",
        }],
      },
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
  });

  it("shows review readiness and links to the immutable preview", async () => {
    render(<ModerationQueue />);
    expect(await screen.findByRole("heading", { name: "Review Skill" })).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review submission/ })).toHaveAttribute("href", "/moderation/listings/product-1");
  });

  it("does not call the queue API without a staff marketplace role", () => {
    session.marketplaceRoles = ["creator"];
    render(<ModerationQueue />);
    expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
    expect(getQueue).not.toHaveBeenCalled();
  });
});
