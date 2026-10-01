import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";

const session = vi.hoisted(() => ({ loading: false, email: "reader@example.com" as string | null, error: null as string | null, marketplaceRoles: [] as string[] }));
const navigation = vi.hoisted(() => ({ pathname: "/dashboard", query: "" }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname, useSearchParams: () => new URLSearchParams(navigation.query) }));

const { DashboardShell } = await import("./dashboard-shell");

function renderShell(locale: Locale = "en") {
  return render(<LocaleProvider locale={locale}><DashboardShell><p>Private screen</p></DashboardShell></LocaleProvider>);
}

describe("dashboard access and navigation", () => {
  afterEach(cleanup);
  beforeEach(() => {
    session.loading = false;
    session.email = "reader@example.com";
    session.error = null;
    session.marketplaceRoles = [];
    navigation.pathname = "/dashboard";
    navigation.query = "";
  });

  it("does not mount private screens before the session is resolved or after it fails", () => {
    session.loading = true;
    const { rerender } = renderShell();
    expect(screen.queryByText("Private screen")).not.toBeInTheDocument();
    session.loading = false;
    session.error = "Unavailable";
    rerender(<DashboardShell><p>Private screen</p></DashboardShell>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Private screen")).not.toBeInTheDocument();
  });

  it("preserves the Persian nested return path and query for anonymous visitors", () => {
    session.email = null;
    navigation.pathname = "/fa/dashboard/creator/listings/tool/edit";
    navigation.query = "tab=draft";
    renderShell("fa");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/fa/account?next=${encodeURIComponent(`${navigation.pathname}?tab=draft`)}`);
    expect(screen.queryByText("Private screen")).not.toBeInTheDocument();
  });

  it("shows the reader workspace and onboarding, with no staff or provider links", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Account & library" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Creator workspace" })).toHaveAttribute("href", "/dashboard/creator");
    expect(screen.queryByRole("link", { name: "Connections" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Moderation" })).not.toBeInTheDocument();
    expect(screen.getByText("Private screen")).toBeInTheDocument();
  });

  it.each(["/dashboard/connections", "/dashboard/creator/listings/new", "/dashboard/moderation", "/dashboard/moderation/listings/tool"])("blocks direct reader access to %s", (pathname) => {
    navigation.pathname = pathname;
    renderShell();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Private screen")).not.toBeInTheDocument();
  });

  it("allows creator connections and highlights the Persian nested creator route", () => {
    session.marketplaceRoles = ["creator"];
    navigation.pathname = "/fa/dashboard/creator/listings/tool/edit";
    renderShell("fa");
    expect(screen.getByRole("link", { name: "اتصال‌ها" })).toHaveAttribute("href", "/fa/dashboard/connections");
    expect(screen.getByRole("link", { name: "فضای سازنده" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Private screen")).toBeInTheDocument();
  });

  it.each(["moderator", "administrator"])("allows marketplace %s moderation without granting creator connections", (role) => {
    session.marketplaceRoles = [role];
    navigation.pathname = "/dashboard/moderation/listings/tool";
    renderShell();
    expect(screen.getByRole("link", { name: "Moderation" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Connections" })).not.toBeInTheDocument();
    expect(screen.getByText("Private screen")).toBeInTheDocument();
  });
});
