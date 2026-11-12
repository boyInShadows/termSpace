import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { supportTitle } from "@/features/support/support-entry";
import { DashboardSidebar, DashboardTabBar } from "@/features/dashboard/dashboard-nav";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "fa", pathname: "/dashboard", roles: [] as string[] }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: state.locale, t: copy[state.locale] }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "member@example.test", marketplaceRoles: state.roles }) }));

describe("desktop support navigation", () => {
  for (const locale of ["en", "fa"] as const) for (const staff of [false, true]) {
    it(`links to localized tickets and tracks nested routes without changing phone tabs (${locale}, staff=${staff})`, () => {
      state.locale = locale; state.roles = staff ? ["moderator"] : [];
      const prefix = locale === "fa" ? "/fa" : "";
      state.pathname = `${prefix}/dashboard/tickets`;
      const view = render(<><DashboardSidebar /><DashboardTabBar /></>);
      const sidebar = screen.getByRole("navigation", { name: copy[locale].dashboard });
      const tabs = screen.getByRole("navigation", { name: copy[locale].dashboardHome.tabsLabel });
      const support = within(sidebar).getByRole("link", { name: supportTitle[locale] });
      expect(support).toHaveAttribute("href", `${prefix}/dashboard/tickets`);
      expect(within(tabs).queryByRole("link", { name: supportTitle[locale] })).not.toBeInTheDocument();
      expect(within(tabs).getAllByRole("link")).toHaveLength(staff ? 6 : 5);
      for (const suffix of ["", "/new", "/ticket-1", "/inbox", "/inbox/ticket-1"]) {
        state.pathname = `${prefix}/dashboard/tickets${suffix}`;
        view.rerender(<><DashboardSidebar /><DashboardTabBar /></>);
        expect(support).toHaveAttribute("aria-current", "page");
      }
      state.pathname = `${prefix}/dashboard/library`;
      view.rerender(<><DashboardSidebar /><DashboardTabBar /></>);
      expect(support).not.toHaveAttribute("aria-current");
    });
  }
});
