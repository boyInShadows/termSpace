"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, Settings, Store } from "lucide-react";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

/**
 * Dashboard navigation: a sidebar from `lg` up, a bottom tab bar and a
 * floating Publish button below it.
 *
 * Every entry points at a real page — a nav item that goes nowhere is the same
 * dead end `pending.md` already tracks for the footer. Add a route before you
 * add its link.
 */
function useDashboardNav() {
  const { locale, t } = useLocale();
  const pathname = usePathname() ?? "/dashboard";
  // The Persian tree is served under `/fa` by a rewrite, but the browser path
  // keeps the prefix.
  const current = locale === "fa" ? pathname.slice(3) || "/" : pathname;

  return [
    { href: "/dashboard", label: t.navOverview, icon: LayoutGrid },
    { href: "/dashboard/studio", label: t.navStudio, icon: Store },
    { href: "/dashboard/settings", label: t.navSettings, icon: Settings },
  ].map((item) => ({
    ...item,
    href: localePath(item.href, locale),
    // `/dashboard` would otherwise match every nested route.
    active: item.href === "/dashboard" ? current === "/dashboard" : current.startsWith(item.href),
  }));
}

export function DashboardSidebar() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const items = useDashboardNav();
  const initial = session.email?.charAt(0).toUpperCase() ?? "";

  return (
    <aside className="hidden border-e border-border lg:block">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col px-3 py-6">
        <nav aria-label={t.dashboard}>
          <ul className="space-y-1">
            {items.map(({ href, label, icon: Icon, active }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-[var(--duration-fast)]",
                    active
                      ? "bg-primary-soft text-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  {active && <span aria-hidden className="absolute -start-3 h-5 w-0.5 rounded-e bg-primary" />}
                  <Icon aria-hidden className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="my-3 border-t border-border" />
        <PublishLink className="h-9 rounded-lg" />

        <Link
          href={localePath("/dashboard/settings", locale)}
          className="mt-auto flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface"
        >
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold ring-1 ring-border">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm">{session.email}</span>
            <span className="block font-mono text-xs text-muted-foreground">{t.dashboardHome.toAccount}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

export function DashboardTabBar() {
  const { t } = useLocale();
  const items = useDashboardNav();

  return (
    <>
      <nav
        aria-label={t.dashboardHome.tabsLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-3">
          {items.map(({ href, label, icon: Icon, active }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <PublishLink
        iconOnly
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] end-5 z-40 size-14 rounded-full shadow-[var(--shadow-lift)] lg:hidden"
      />
    </>
  );
}

/**
 * The page's one primary action. A reader without a creator profile lands on
 * the creator hub, which walks them through onboarding first.
 */
function PublishLink({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const href = session.marketplaceRoles.includes("creator") ? "/creator/listings/new" : "/creator";

  return (
    <Link
      href={localePath(href, locale)}
      aria-label={iconOnly ? t.dashboardHome.publish : undefined}
      className={cn(
        "flex items-center justify-center gap-2 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover",
        className,
      )}
    >
      <Plus aria-hidden className={iconOnly ? "size-6" : "size-4"} />
      {!iconOnly && t.dashboardHome.publish}
    </Link>
  );
}
