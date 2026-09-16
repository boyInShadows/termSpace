import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getDashboard = vi.hoisted(() => vi.fn());
const localeState = vi.hoisted(() => ({ locale: "en" as "en" | "fa" }));

const copy = {
  dashboardLoading: "Loading dashboard", dashboardLoadError: "Dashboard failed", retry: "Try again",
  dashboardEyebrow: "Creator dashboard", dashboardTitle: "Your work on TermSpace", dashboardIntro: "Track every listing.",
  totalListings: "Total listings", publishedListings: "Published", inReviewListings: "In review", totalAcquisitions: "Acquisitions",
  yourListings: "Your listings", listingsIntro: "Owned listings", noListings: "No listings yet", noListingsIntro: "Workspace ready",
  version: "Version", rating: "Rating", reviews: "Reviews", acquisitions: "Acquisitions", releases: "Releases", noRating: "Not rated",
  moderationFeedback: "Latest moderation feedback", recentUpdates: "Recent updates", noRecentUpdates: "No updates", updated: "Updated",
  viewPublic: "View public page", paginationLabel: "Creator listings pages", previousPage: "Previous", nextPage: "Next", pageStatus: "Page {page} of {pages}",
  newListing: "New listing", editDraft: "Edit draft",
  statusDraft: "Draft", statusSubmitted: "Submitted", statusChangesRequested: "Changes requested", statusApproved: "Approved",
  statusPublished: "Published", statusRejected: "Rejected", statusSuspended: "Suspended", statusArchived: "Archived",
  actionDraftSaved: "Draft saved", actionSubmitted: "Submitted for review", actionWithdrawn: "Withdrawn", actionChangesRequested: "Changes requested",
  actionApproved: "Approved", actionPublished: "Published", actionRejected: "Rejected", actionSuspended: "Suspended",
  actionReinstated: "Reinstated", actionArchived: "Archived", actionRestored: "Restored",
};

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getCreatorDashboard: getDashboard };
});
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: localeState.locale, t: { creatorHub: copy } }) }));

const { CreatorDashboard } = await import("./creator-dashboard");

function dashboardResult(page = 1) {
  return {
    data: {
      summary: { totalListings: 13, publishedListings: 4, inReviewListings: 2, totalAcquisitions: 27 },
      listings: [{
        id: `product-${page}`, slug: "owned-skill", name: "Owned Skill", type: "Skill", typeKey: "skill",
        state: "changes_requested", lifecycleVersion: 3, published: true, rating: 4.5, reviewCount: 2,
        acquisitionCount: 7, currentVersion: "1.1.0", releaseCount: 2,
        latestRelease: { version: "1.1.0", releasedAt: "2026-09-15T10:00:00.000Z" },
        moderationFeedback: { action: "changes_requested", reasonCode: "PERMISSIONS_UNCLEAR", message: "Clarify network access.", createdAt: "2026-09-16T09:00:00.000Z" },
        recentUpdates: [{ id: `event-${page}`, action: "changes_requested", state: "changes_requested", message: "Clarify network access.", createdAt: "2026-09-16T09:00:00.000Z" }],
        updatedAt: "2026-09-16T10:00:00.000Z",
      }],
    },
    meta: { page, limit: 12, total: 13, totalPages: 2 },
  };
}

describe("CreatorDashboard", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    localeState.locale = "en";
    getDashboard.mockResolvedValue(dashboardResult());
  });

  it("shows owner listing status, feedback, releases, ratings, and completed acquisitions", async () => {
    render(<CreatorDashboard />);

    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getAllByText("Changes requested", { selector: "span" })).toHaveLength(2);
    expect(screen.getByText("Clarify network access.")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /New listing/ })).toHaveAttribute("href", "/creator/listings/new");
    expect(screen.getByRole("link", { name: /Edit draft/ })).toHaveAttribute("href", "/creator/listings/product-1/edit");
    expect(screen.getByRole("link", { name: /View public page/ })).toHaveAttribute("href", "/products/owned-skill");
  });

  it("loads the next bounded listing page", async () => {
    getDashboard.mockImplementation((page: number) => Promise.resolve(dashboardResult(page)));
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    await waitFor(() => expect(getDashboard).toHaveBeenLastCalledWith(2, 12, expect.any(AbortSignal)));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("formats dashboard metrics with Persian digits in the Persian locale", async () => {
    localeState.locale = "fa";
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    expect(screen.getByText("۲۷")).toBeInTheDocument();
  });
});
