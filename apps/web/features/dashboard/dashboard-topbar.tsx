"use client";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe, Search } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { libraryCopy } from "@/features/library/library-copy";

const noSubscribe = () => () => {};
/** The hint names the key the reader will actually press. */
const readShortcutHint = () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K");

/**
 * A workbench bar in place of the marketing header: the wordmark back to the
 * site, where you are, catalog search, and the account controls.
 */
export function DashboardTopbar() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const pathname = usePathname() ?? "/dashboard";
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const shortcutHint = useSyncExternalStore(noSubscribe, readShortcutHint, () => "⌘K");

  const currentPath = locale === "fa" ? pathname.slice(3) || "/" : pathname;
  const query = searchParams.toString();
  const switchHref = `${locale === "fa" ? currentPath : localePath(currentPath, "fa")}${query ? `?${query}` : ""}`;
  const breadcrumb = currentPath.endsWith("/releases") ? t.creatorReleases.title
    : currentPath.endsWith("/edit") ? t.creatorDraft.editTitle
      : currentPath.endsWith("/new") ? t.creatorDraft.createTitle
        : currentPath.endsWith("/library") ? libraryCopy[locale].label
          : currentPath.endsWith("/settings") ? t.navSettings
            : currentPath.startsWith("/dashboard/moderation") ? t.moderationNav
              : currentPath.startsWith("/dashboard/studio") ? t.navStudio : t.navOverview;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-5 lg:px-6">
        <Logo />
        <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:inline" title={breadcrumb}>
          {breadcrumb}
        </span>

        <form role="search" action={localePath("/explore", locale)} className="order-last w-full md:order-none md:mx-auto md:min-w-40 md:max-w-md md:flex-1">
          <label htmlFor="dashboard-search" className="sr-only">
            {t.dashboardHome.searchLabel}
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              id="dashboard-search"
              name="q"
              type="search"
              placeholder={t.dashboardHome.searchPlaceholder}
              className="h-11 w-full rounded-none border border-border bg-surface pe-16 ps-9 text-base placeholder:text-muted-foreground"
            />
            <kbd
              aria-hidden
              className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {shortcutHint}
            </kbd>
          </div>
        </form>

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <ThemeToggle />
          <Link
            href={switchHref}
            lang={locale === "fa" ? "en" : "fa"}
            aria-label={t.language}
            className={cn(buttonVariants({ variant: "ghost" }), "gap-2 px-2.5 sm:px-3")}
          >
            <Globe size={15} aria-hidden />
            <span className="hidden sm:inline">{t.language}</span>
          </Link>
          <Link
            href={localePath("/dashboard/settings", locale)}
            aria-label={t.dashboardHome.toAccount}
            className="ms-1 grid size-11 shrink-0 place-items-center rounded-none text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span aria-hidden className="grid size-8 place-items-center rounded-none bg-primary-soft ring-1 ring-border">{session.email?.charAt(0).toUpperCase()}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
