import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import type { DashboardHome } from "@/lib/dashboard";

const getHome = vi.hoisted(() => vi.fn());

vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return { ...original, getDashboardHome: getHome };
});
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/features/account/marketplace-session", () => ({
  useMarketplaceSession: () => ({ email: "kasra@example.com", marketplaceRoles: ["creator"] }),
}));

const { DashboardOverview } = await import("./overview");

function creatorHome(listingCount = 1): DashboardHome {
  return {
    kind: "creator",
    profile: {
      id: "c1", name: "Kasra", handle: "kasra", initials: "K", verified: false, bio: "", followers: 0,
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", accessActive: true,
    } as unknown as Extract<DashboardHome, { kind: "creator" }>["profile"],
    dashboard: {
      summary: { totalListings: listingCount, publishedListings: listingCount, inReviewListings: 2, totalAcquisitions: 1234 },
      listings: Array.from({ length: listingCount }, (_, index) => ({
        id: `listing-${index}`, slug: `listing-${index}`, name: `Conversion Copywriter ${index}`, type: "Skill", typeKey: "skill",
        state: "changes_requested", lifecycleVersion: 1, published: true, rating: 0, reviewCount: 0,
        acquisitionCount: 41, currentVersion: "2.4.0", releaseCount: 1, latestRelease: null, moderationFeedback: null,
        recentUpdates: [{ id: `event-${index}`, action: "published", state: "published", message: null, createdAt: "2026-09-20T10:00:00Z" }],
        updatedAt: "2026-09-20T10:00:00Z",
      })),
    },
  };
}

describe("DashboardOverview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("greets the creator and shows their totals, listings and activity", async () => {
    getHome.mockResolvedValue(creatorHome());
    render(<DashboardOverview />);

    await screen.findByRole("table");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^Good (morning|afternoon|evening), Kasra\.$/);
    expect(screen.getByText("2 in review and 1,234 acquisitions across 1 listings.")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();

    const table = screen.getByRole("table");
    const row = within(table).getByRole("link", { name: /Conversion Copywriter 0/ });
    expect(row).toHaveAttribute("href", "/creator/listings/listing-0/releases");
    expect(within(table).getByText(copy.en.creatorHub.statusChangesRequested)).toBeInTheDocument();
    expect(within(table).getByText("v2.4.0")).toBeInTheDocument();

    const activity = screen.getByRole("region", { name: copy.en.dashboardHome.activityTitle });
    expect(within(activity).getByText(`· ${copy.en.creatorHub.actionPublished}`)).toBeInTheDocument();
  });

  it("caps the table at eight listings", async () => {
    getHome.mockResolvedValue(creatorHome(10));
    render(<DashboardOverview />);

    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(9); // header + 8
  });

  it("points a reader without a creator workspace at onboarding", async () => {
    getHome.mockResolvedValue({ kind: "no-profile" });
    render(<DashboardOverview />);

    const cta = await screen.findByRole("link", { name: copy.en.dashboardHome.noProfileCta });
    expect(cta).toHaveAttribute("href", "/creator");
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/, kasra\.$/);
    expect(screen.getByText(copy.en.dashboardHome.emptyActivity)).toBeInTheDocument();
  });

  it("makes an empty creator workspace look intentional", async () => {
    getHome.mockResolvedValue(creatorHome(0));
    render(<DashboardOverview />);

    const cta = await screen.findByRole("link", { name: copy.en.dashboardHome.emptyListingsCta });
    expect(cta).toHaveAttribute("href", "/creator/listings/new");
    expect(screen.getByText(copy.en.dashboardHome.summaryEmpty)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an inline error in each data card and recovers on retry", async () => {
    getHome.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(creatorHome());
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardOverview />);

    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(screen.getByText(copy.en.dashboardHome.summaryError)).toBeInTheDocument();
    // Quick actions do not depend on the fetch and stay usable.
    expect(screen.getByRole("link", { name: /Publish a new listing/ })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: copy.en.dashboardHome.retry })[0]);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getHome).toHaveBeenCalledTimes(2);
  });
});
