"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

const noSubscribe = () => () => {};
/** The hint names the key the reader will actually press. */
const readShortcutHint = () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K");

/** Workspace search is a content control; the root layout owns the header. */
export function DashboardSearch() {
  const { locale, t } = useLocale();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const shortcutHint = useSyncExternalStore(noSubscribe, readShortcutHint, () => "⌘K");

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
    <form role="search" action={localePath("/explore", locale)} className="mb-6 w-full sm:ms-auto sm:max-w-md">
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
  );
}
