import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const replace = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ pathname: "/dashboard" }));
const session = vi.hoisted(() => ({
  current: { loading: false, email: null as string | null, marketplaceRoles: [] as string[] },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session.current }));

const { DashboardShell } = await import("./dashboard-shell");

describe("DashboardShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.pathname = "/dashboard";
  });

  it("sends a signed-out visitor to sign in and back here afterwards", () => {
    session.current = { loading: false, email: null, marketplaceRoles: [] };
    nav.pathname = "/dashboard/settings";
    render(<DashboardShell><p>secret</p></DashboardShell>);

    expect(replace).toHaveBeenCalledWith("/account?next=%2Fdashboard%2Fsettings");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("holds the skeleton while the session is still loading", () => {
    session.current = { loading: true, email: null, marketplaceRoles: [] };
    render(<DashboardShell><p>secret</p></DashboardShell>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(copy.en.dashboardHome.loading);
  });

  it("frames the page with a top bar, sidebar and tab bar that mark the current route", () => {
    session.current = { loading: false, email: "kasra@example.com", marketplaceRoles: ["creator"] };
    nav.pathname = "/dashboard/studio";
    render(<DashboardShell><p>content</p></DashboardShell>);

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByRole("search")).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: copy.en.dashboard });
    expect(within(sidebar).getByRole("link", { name: copy.en.navStudio })).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: copy.en.navOverview })).not.toHaveAttribute("aria-current");

    const tabs = screen.getByRole("navigation", { name: copy.en.dashboardHome.tabsLabel });
    expect(within(tabs).getByRole("link", { name: copy.en.navStudio })).toHaveAttribute("aria-current", "page");

    // A creator's Publish goes straight to a new listing.
    for (const link of screen.getAllByRole("link", { name: copy.en.dashboardHome.publish })) {
      expect(link).toHaveAttribute("href", "/creator/listings/new");
    }
  });

  it("sends a reader who is not yet a creator to onboarding when they publish", () => {
    session.current = { loading: false, email: "reader@example.com", marketplaceRoles: [] };
    render(<DashboardShell><p>content</p></DashboardShell>);

    for (const link of screen.getAllByRole("link", { name: copy.en.dashboardHome.publish })) {
      expect(link).toHaveAttribute("href", "/creator");
    }
  });
});
