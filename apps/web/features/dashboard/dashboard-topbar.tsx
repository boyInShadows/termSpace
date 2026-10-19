"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { libraryCopy } from "@/features/library/library-copy";

const noSubscribe = () => () => {};
/** The hint names the key the reader will actually press. */
const readShortcutHint = () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K");

/** Workspace breadcrumb and search; global controls belong to the root header. */
export function DashboardTopbar() {
  const { locale, t } = useLocale();
  const pathname = usePathname() ?? "/dashboard";
  const searchRef = useRef<HTMLInputElement | null>(null);
  const shortcutHint = useSyncExternalStore(noSubscribe, readShortcutHint, () => "⌘K");

  const currentPath = locale === "fa" ? pathname.slice(3) || "/" : pathname;
  const breadcrumb = currentPath.endsWith("/releases") ? t.creatorReleases.title
    : currentPath.endsWith("/edit") ? t.creatorDraft.editTitle
      : currentPath.endsWith("/new") ? t.creatorDraft.createTitle
        : currentPath.endsWith("/library") ? libraryCopy[locale].label
          : currentPath.endsWith("/settings") ? t.navSettings
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
    <div className="border-b border-border pb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 text-sm font-medium text-muted-foreground" title={breadcrumb}>
          {breadcrumb}
        </span>

        <form role="search" action={localePath("/explore", locale)} className="w-full sm:max-w-md sm:flex-1">
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

      </div>
    </div>
  );
}
