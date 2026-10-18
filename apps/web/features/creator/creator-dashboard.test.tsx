import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creatorWorkspace } from "./workspace-copy";

const getDashboard = vi.hoisted(() => vi.fn());
const transitionListing = vi.hoisted(() => vi.fn());
const localeState = vi.hoisted(() => ({ locale: "en" as "en" | "fa" }));

const copy = {
  dashboardLoading: "Loading dashboard", dashboardLoadError: "Dashboard failed", retry: "Try again",
  dashboardEyebrow: "Creator dashboard", dashboardTitle: "Your work on TermSpace", dashboardIntro: "Track every listing.",
  totalListings: "Total listings", publishedListings: "Published", inReviewListings: "In review", totalAcquisitions: "Acquisitions",
  yourListings: "Your listings", listingsIntro: "Owned listings", noListings: "No listings yet", noListingsIntro: "Workspace ready",
  version: "Version", rating: "Rating", reviews: "Reviews", acquisitions: "Acquisitions", releases: "Releases", noRating: "Not rated",
  moderationFeedback: "Latest moderation feedback", recentUpdates: "Recent updates", noRecentUpdates: "No updates", updated: "Updated",
  viewPublic: "View public page", paginationLabel: "Creator listings pages", previousPage: "Previous", nextPage: "Next", pageStatus: "Page {page} of {pages}",
  newListing: "New listing", editDraft: "Edit draft", manageReleases: "Manage releases",
  reviewSubmission: "Review submission", cancelSubmission: "Keep editing", submissionHelp: "Review details before sending to moderators.", submissionSourceRequired: "Verify source", submissionError: "Submission failed; your draft is still available.",
  loadError: "Creator services unavailable.",
  statusDraft: "Draft", statusSubmitted: "Submitted", statusChangesRequested: "Changes requested", statusApproved: "Approved",
  statusPublished: "Published", statusRejected: "Rejected", statusSuspended: "Suspended", statusArchived: "Archived",
  actionDraftSaved: "Draft saved", actionSubmitted: "Submit for review", actionWithdrawn: "Withdrawn", actionChangesRequested: "Changes requested",
  actionApproved: "Approved", actionPublished: "Published", actionRejected: "Rejected", actionSuspended: "Suspended",
  actionReinstated: "Reinstated", actionArchived: "Archived", actionRestored: "Restored",
};

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getCreatorDashboard: getDashboard };
});
vi.mock("./creator-api", () => ({ transitionCreatorListing: transitionListing }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: localeState.locale, t: {
  creatorHub: copy,
  creatorDraft: { versionConflict: "Reload before submitting." },
  creatorReleases: { verifySource: "Verify source" },
} }) }));

const { CreatorDashboard } = await import("./creator-dashboard");
const { ApiError } = await import("@/lib/api");

function dashboardResult(page = 1) {
  return {
    data: {
      summary: { totalListings: 13, publishedListings: 4, inReviewListings: 2, totalAcquisitions: 27 },
      listings: [{
        id: `product-${page}`, slug: "owned-skill", name: "Owned Skill", type: "Skill", typeKey: "skill",
        state: "changes_requested", lifecycleVersion: 3, published: true, restoreTarget: null as { state: string; published: boolean } | null, rating: 4.5, reviewCount: 2,
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
    transitionListing.mockResolvedValue({ state: "submitted", version: 4, published: true });
  });

  it("shows owner listing status, feedback, releases, ratings, and completed acquisitions", async () => {
    render(<CreatorDashboard />);

    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getAllByText("Changes requested", { selector: "span" })).toHaveLength(2);
    expect(screen.getByText("Clarify network access.")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /New listing/ })).toHaveAttribute("href", "/dashboard/studio/listings/new");
    expect(screen.getByRole("link", { name: /Edit draft/ })).toHaveAttribute("href", "/dashboard/studio/listings/product-1/edit");
    expect(screen.getByRole("link", { name: /Manage releases/ })).toHaveAttribute("href", "/dashboard/studio/listings/product-1/releases");
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

  it("confirms and submits an editable draft with optimistic concurrency", async () => {
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });

    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    expect(transitionListing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));

    await waitFor(() => expect(transitionListing).toHaveBeenCalledWith("product-1", 3, "SUBMIT"));
    expect(await screen.findByText("Submitted", { selector: "span" })).toBeInTheDocument();
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
  });

  it("keeps the draft editable and links to releases when source verification is required", async () => {
    transitionListing.mockRejectedValue(new ApiError(409, "SOURCE_VERIFICATION_REQUIRED", "Source verification required"));
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });

    fireEvent.click(screen.getByRole("button", { name: "Review submission" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(creatorWorkspace.en.creatorHub.submissionSourceRequired)).toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: "Manage releases" })).toHaveAttribute(
      "href",
      "/dashboard/studio/listings/product-1/releases",
    );
    expect(screen.getByRole("link", { name: /Edit draft/ })).toBeInTheDocument();
  });

  it("formats dashboard metrics with Persian digits in the Persian locale", async () => {
    localeState.locale = "fa";
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    expect(screen.getByText("۲۷")).toBeInTheDocument();
  });

  it.each(["draft", "changes_requested", "rejected", "approved", "published", "suspended", "archived"])("does not offer withdrawal for %s", async (state) => {
    const result = dashboardResult();
    result.data.listings[0].state = state;
    getDashboard.mockResolvedValue(result);
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    expect(screen.queryByRole("button", { name: creatorWorkspace.en.creatorHub.withdrawReview })).not.toBeInTheDocument();
  });

  it.each(["en", "fa"] as const)("confirms, cancels and withdraws without hiding an existing publication (%s)", async (locale) => {
    localeState.locale = locale;
    const hub = creatorWorkspace[locale].creatorHub;
    const before = dashboardResult();
    before.data.listings[0].state = "submitted";
    const after = dashboardResult();
    after.data.listings[0].state = "draft";
    after.data.listings[0].lifecycleVersion = 4;
    after.data.summary.inReviewListings = 1;
    getDashboard.mockResolvedValueOnce(before).mockResolvedValue(after);
    let complete!: (value: { state: string; version: number; published: boolean }) => void;
    transitionListing.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    fireEvent.click(screen.getByRole("button", { name: hub.withdrawReview }));
    expect(screen.getByText(hub.withdrawalHelp)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: hub.keepInReview }));
    expect(transitionListing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: hub.withdrawReview }));
    const confirm = screen.getByRole("button", { name: hub.confirmWithdrawal });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(confirm).toBeDisabled();
    expect(screen.getByRole("button", { name: hub.keepInReview })).toBeDisabled();
    expect(transitionListing).toHaveBeenCalledExactlyOnceWith("product-1", 3, "WITHDRAW");
    complete({ state: "draft", version: 4, published: true });
    await screen.findByText(hub.withdrawalSuccess);
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Draft", { selector: "span" })).toBeInTheDocument();
    const count = screen.getByText("In review").closest("div")!;
    expect(within(count).getByText(locale === "fa" ? "۱" : "1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit draft/ })).toHaveAttribute("href", `${locale === "fa" ? "/fa" : ""}/dashboard/studio/listings/product-1/edit`);
    expect(screen.getByRole("link", { name: /View public page/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: hub.withdrawReview })).not.toBeInTheDocument();
  });

  it.each(["LISTING_VERSION_CONFLICT", "INVALID_LISTING_TRANSITION"])("requires a successful refresh after %s", async (code) => {
    const hub = creatorWorkspace.en.creatorHub;
    const before = dashboardResult();
    before.data.listings[0].state = "submitted";
    const after = dashboardResult();
    after.data.listings[0].state = "approved";
    getDashboard.mockResolvedValueOnce(before).mockRejectedValueOnce(new Error("Offline")).mockResolvedValue(after);
    transitionListing.mockRejectedValue(new ApiError(409, code, "Changed"));
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    fireEvent.click(screen.getByRole("button", { name: hub.withdrawReview }));
    fireEvent.click(screen.getByRole("button", { name: hub.confirmWithdrawal }));
    await screen.findByText(hub.withdrawalConflict);
    expect(screen.getByRole("button", { name: hub.confirmWithdrawal })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: hub.keepInReview }));
    fireEvent.click(screen.getByRole("button", { name: hub.withdrawReview }));
    expect(screen.getByRole("button", { name: hub.confirmWithdrawal })).toBeDisabled();
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Try again" }));
    await screen.findByText("Dashboard failed");
    expect(screen.getByRole("button", { name: hub.confirmWithdrawal })).toBeDisabled();
    fireEvent.click(within(screen.getByText("Dashboard failed").parentElement!).getByRole("button", { name: "Try again" }));
    await screen.findByText("Approved", { selector: "span" });
    expect(screen.queryByRole("button", { name: hub.confirmWithdrawal })).not.toBeInTheDocument();
    expect(transitionListing).toHaveBeenCalledTimes(1);
  });

  it.each(["draft", "submitted", "changes_requested", "approved", "published", "rejected"])("offers cancellable archive only for an allowed state: %s", async (state) => {
    const hub = creatorWorkspace.en.creatorHub;
    const result = dashboardResult();
    result.data.listings[0].state = state;
    getDashboard.mockResolvedValue(result);
    render(<CreatorDashboard />);
    const button = await screen.findByRole("button", { name: hub.archiveListing });
    fireEvent.click(button);
    expect(screen.getByText(hub.archiveHelp)).toBeInTheDocument();
    const cancel = screen.getByRole("button", { name: hub.cancelArchive });
    cancel.focus();
    fireEvent.click(cancel);
    expect(button).toHaveFocus();
    expect(screen.queryByRole("button", { name: hub.confirmArchive })).not.toBeInTheDocument();
    expect(transitionListing).not.toHaveBeenCalled();
  });

  it.each(["suspended", "archived"])("does not allow archive/restore for %s without a server restore target", async (state) => {
    const hub = creatorWorkspace.en.creatorHub;
    const result = dashboardResult();
    result.data.listings[0].state = state;
    getDashboard.mockResolvedValue(result);
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    expect(screen.queryByRole("button", { name: hub.archiveListing })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: hub.restoreListing })).not.toBeInTheDocument();
    if (state === "archived") expect(screen.getByText(hub.restoreUnavailable)).toBeInTheDocument();
  });

  it.each([true, false])("archives and restores the server's previous state with published=%s", async (published) => {
    const hub = creatorWorkspace.en.creatorHub;
    const state = published ? "published" : "submitted";
    const before = dashboardResult();
    Object.assign(before.data.listings[0], { state, published });
    const archived = dashboardResult();
    Object.assign(archived.data.listings[0], { state: "archived", lifecycleVersion: 4, published: false, restoreTarget: { state, published } });
    archived.data.summary.publishedListings = 0;
    archived.data.summary.inReviewListings = 0;
    const restored = dashboardResult();
    Object.assign(restored.data.listings[0], { state, published, lifecycleVersion: 5 });
    getDashboard.mockResolvedValueOnce(before).mockResolvedValueOnce(archived).mockResolvedValueOnce(restored);
    transitionListing.mockResolvedValueOnce({ state: "archived", version: 4, published: false }).mockResolvedValueOnce({ state, version: 5, published });
    render(<CreatorDashboard />);
    fireEvent.click(await screen.findByRole("button", { name: hub.archiveListing }));
    fireEvent.click(screen.getByRole("button", { name: hub.confirmArchive }));
    await screen.findByText(hub.archiveSuccess);
    const restore = await screen.findByRole("button", { name: hub.restoreListing });
    expect(screen.queryByRole("link", { name: /View public page/ })).not.toBeInTheDocument();
    fireEvent.click(restore);
    expect(screen.getByText(published ? hub.restorePublicHelp : hub.restorePrivateHelp, { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: hub.cancelRestore }));
    expect(transitionListing).toHaveBeenCalledTimes(1);
    fireEvent.click(restore);
    fireEvent.click(screen.getByRole("button", { name: hub.confirmRestore }));
    await screen.findByText(hub.restoreSuccess);
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(3));
    expect(transitionListing.mock.calls).toEqual([["product-1", 3, "ARCHIVE"], ["product-1", 4, "RESTORE"]]);
    expect(screen.queryByRole("link", { name: /View public page/ }) !== null).toBe(published);
    expect(screen.getByText(published ? "Published" : "Submitted", { selector: "span" })).toBeInTheDocument();
  });

  it("keeps an archived listing and explains approved-source blockers before retrying restore", async () => {
    const hub = creatorWorkspace.en.creatorHub;
    const result = dashboardResult();
    Object.assign(result.data.listings[0], { state: "archived", published: false, restoreTarget: { state: "published", published: true } });
    getDashboard.mockResolvedValue(result);
    transitionListing.mockRejectedValueOnce(new ApiError(409, "SOURCE_VERIFICATION_REQUIRED", "Source required"))
      .mockRejectedValueOnce(new Error("Offline"));
    render(<CreatorDashboard />);
    fireEvent.click(await screen.findByRole("button", { name: hub.restoreListing }));
    fireEvent.click(screen.getByRole("button", { name: hub.confirmRestore }));
    expect(await screen.findByText(hub.restoreSourceRequired)).toBeInTheDocument();
    expect(within(screen.getByRole("alert")).getByRole("link", { name: "Manage releases" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View public page/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: hub.confirmRestore }));
    expect(await screen.findByText(hub.archiveError)).toBeInTheDocument();
    expect(screen.getByText("Archived", { selector: "span" })).toBeInTheDocument();
  });

  it("refreshes a stale restore and removes the action when staff archived it", async () => {
    const hub = creatorWorkspace.en.creatorHub;
    const before = dashboardResult();
    Object.assign(before.data.listings[0], { state: "archived", published: false, restoreTarget: { state: "draft", published: false } });
    const after = dashboardResult();
    Object.assign(after.data.listings[0], { state: "archived", published: false, lifecycleVersion: 4 });
    getDashboard.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
    transitionListing.mockRejectedValue(new ApiError(409, "INVALID_LISTING_TRANSITION", "Staff archive"));
    render(<CreatorDashboard />);
    fireEvent.click(await screen.findByRole("button", { name: hub.restoreListing }));
    fireEvent.click(screen.getByRole("button", { name: hub.confirmRestore }));
    await screen.findByText(hub.archiveConflict);
    expect(screen.getByRole("button", { name: hub.confirmRestore })).toBeDisabled();
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Try again" }));
    await screen.findByText(hub.restoreUnavailable);
    expect(screen.queryByRole("button", { name: hub.restoreListing })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: hub.confirmRestore })).not.toBeInTheDocument();
    expect(transitionListing).toHaveBeenCalledTimes(1);
  });

  it("keeps the submitted listing and permits retry after an unconfirmed failure", async () => {
    const hub = creatorWorkspace.en.creatorHub;
    const result = dashboardResult();
    result.data.listings[0].state = "submitted";
    getDashboard.mockResolvedValue(result);
    transitionListing.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ state: "draft", version: 4, published: true });
    render(<CreatorDashboard />);
    await screen.findByRole("heading", { name: "Owned Skill" });
    fireEvent.click(screen.getByRole("button", { name: hub.withdrawReview }));
    fireEvent.click(screen.getByRole("button", { name: hub.confirmWithdrawal }));
    await screen.findByText(hub.withdrawalError);
    expect(screen.getByText("Submitted", { selector: "span" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: hub.confirmWithdrawal }));
    await screen.findByText(hub.withdrawalSuccess);
    expect(transitionListing).toHaveBeenCalledTimes(2);
  });
});
