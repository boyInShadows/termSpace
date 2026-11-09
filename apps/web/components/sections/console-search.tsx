"use client";

import { Suspense, use, useId, useMemo, useState } from "react";
import { Search, CornerDownLeft, Clock3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { buttonVariants } from "@/components/ui/button";
import { useStoredString } from "@/lib/hooks/use-stored-string";
import { formatNumber } from "@/lib/format";
import type { MarketplaceTypeCount } from "@/lib/types";
import { localePath } from "@/lib/i18n";

/** The `type` values the shortcut chips filter on; labels come from i18n. */
const SHORTCUTS = ["skill", "agent", "mcp_server", "prompt", "rule"] as const;

const RECENT_KEY = "termspace:recent-searches";
const RECENT_LIMIT = 4;
const NO_RECENT: string[] = [];

/**
 * Past searches, stored per browser.
 *
 * Parsed defensively: the key is reachable from devtools and from older
 * versions of this component, so anything that is not a list of strings is
 * treated as nothing rather than trusted.
 */
function parseRecent(raw: string | null): string[] {
  if (!raw) return NO_RECENT;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return NO_RECENT;
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .slice(0, RECENT_LIMIT);
  } catch {
    return NO_RECENT;
  }
}

/**
 * The search bar, treated as the product's command line rather than as a
 * form field.
 *
 * Only the visitor's own recent searches are suggested; nothing is invented.
 *
 * Two placements. `hero` sits in the hero's copy column as the page's primary
 * action — this is a library, so search is the thing most people came to do,
 * and it does not belong below the fold. `band` is the wider standalone strip
 * used anywhere else on the site.
 */
export function ConsoleSearch({
  variant = "band",
  types,
  browseLabel,
}: {
  variant?: "hero" | "band";
  /** Hero only: the text before the type shortcuts. */
  browseLabel?: string;
  /**
   * Per-type listing counts, or a promise of them.
   *
   * The page hands over a promise so the hero — which is the page shell —
   * never waits on the catalogue to render: the chips paint immediately and
   * their counts stream in behind their own boundary. A promise here has to
   * come from a Server Component; React only supports `use()` on promises
   * created there, which is also why the array form exists.
   */
  types?: MarketplaceTypeCount[] | Promise<MarketplaceTypeCount[]>;
}) {
  const { t, locale } = useLocale();
  const [isFocused, setIsFocused] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [storedRecent, setStoredRecent] = useStoredString(RECENT_KEY);
  const recent = useMemo(() => parseRecent(storedRecent), [storedRecent]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const suggestionsId = useId();

  const isHero = variant === "hero";

  function remember(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setStoredRecent(
      JSON.stringify(
        [trimmed, ...recent.filter((entry) => entry !== trimmed)].slice(
          0,
          RECENT_LIMIT,
        ),
      ),
    );
  }

  const suggestions = recent;
  const isSuggesting = isFocused && !dismissed && query.trim().length === 0 && suggestions.length > 0;

  return (
    <div className={isHero ? undefined : "container-page"}>
      <form
        action={localePath("/explore", locale)}
        onSubmit={() => remember(query)}
        className={cn("group relative", isHero ? "w-full" : "mx-auto max-w-3xl")}
      >
        {/* Plasma bloom behind the field. The hero is plain: its field is a
            ruled box that takes the accent on focus. */}
        {!isHero && (
          <div
            aria-hidden
            className="absolute -inset-px rounded-xl opacity-0 blur-md transition-opacity duration-500 group-focus-within:opacity-70"
            style={{
              background:
                "linear-gradient(100deg, var(--primary), var(--spark), var(--accent))",
            }}
          />
        )}

        {/* The active scope travels with the form, so pressing Enter searches
            inside it and an empty query still lands on that type's listing. */}
        {scope && <input type="hidden" name="type" value={scope} />}

        <div
          className={cn(
            "relative flex items-center transition-colors",
            isHero
              ? "rounded-full border border-border-strong bg-background pe-1.5 focus-within:border-primary"
              : "rounded-control border border-border-strong bg-surface/90 shadow-panel backdrop-blur focus-within:border-transparent",
          )}
        >
          <Search
            size={19}
            className="ms-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
            aria-hidden
          />
          <input
            name="q"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setDismissed(false); }}
            aria-label={t.homePage.searchLabel}
            placeholder={t.homePage.searchPrompt}
            autoComplete="off"
            role="combobox"
            aria-expanded={isSuggesting}
            aria-controls={suggestionsId}
            aria-activedescendant={isSuggesting && activeIndex >= 0 ? `${suggestionsId}-${activeIndex}` : undefined}
            onFocus={() => { setIsFocused(true); setDismissed(false); }}
            onKeyDown={(event) => {
              if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !query.trim()) {
                event.preventDefault();
                setDismissed(false);
                setActiveIndex((index) => event.key === "ArrowDown" ? (index + 1) % suggestions.length : (index < 0 ? suggestions.length - 1 : (index - 1 + suggestions.length) % suggestions.length));
              } else if (event.key === "Escape" && isSuggesting) {
                event.preventDefault();
                setDismissed(true);
                setActiveIndex(-1);
              } else if (event.key === "Enter" && isSuggesting && activeIndex >= 0) {
                event.preventDefault();
                setQuery(suggestions[activeIndex]);
                setDismissed(true);
                setActiveIndex(-1);
              }
            }}
            // Blur is deferred so a click on a suggestion lands before the
            // list unmounts.
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            className={cn(
              "min-w-0 flex-1 bg-transparent px-4 text-base placeholder:text-muted-foreground focus-visible:outline-none!",
              isHero ? "h-12" : "h-16",
            )}
          />
          {isHero ? (
            <button
              type="submit"
              aria-label={t.homePage.searchCta}
              className={cn(buttonVariants({ size: "icon" }), "shrink-0 rounded-full")}
            >
              <CornerDownLeft size={16} aria-hidden />
            </button>
          ) : (
            <>
              <button
                type="submit"
                className={cn(buttonVariants(), "me-2 hidden sm:inline-flex")}
              >
                {t.homePage.searchCta}
                <CornerDownLeft size={14} aria-hidden />
              </button>
              <button
                type="submit"
                aria-label={t.homePage.searchCta}
                className={cn(buttonVariants({ size: "icon" }), "me-2 shrink-0 sm:hidden")}
              >
                <Search size={17} aria-hidden />
              </button>
            </>
          )}
        </div>

        {isSuggesting && (
          <ul
            id={suggestionsId}
            role="listbox"
            aria-label={t.homePage.recentSearches}
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-panel"
          >
            <li role="presentation" className="eyebrow px-4 pb-1 pt-3">
              {t.homePage.recentSearches}
            </li>
            {suggestions.map((suggestion, index) => (
              <li key={suggestion} id={`${suggestionsId}-${index}`} role="option" aria-selected={activeIndex === index}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setQuery(suggestion)}
                  className={cn("flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition-colors hover:bg-muted", activeIndex === index && "bg-muted")}
                >
                  <Clock3 size={14} className="shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div
        className={cn(
          "flex flex-wrap",
          isHero ? "mt-3 items-center justify-center gap-x-1 gap-y-1 text-sm" : "mt-5 justify-center gap-2",
        )}
      >
        {isHero && browseLabel && (
          <span className="me-2 font-semibold">{browseLabel}</span>
        )}
        {types && !Array.isArray(types) ? (
          <Suspense fallback={<ScopeChips scope={scope} onToggle={setScope} plain={isHero} />}>
            <CountedScopeChips
              typesPromise={types}
              scope={scope}
              onToggle={setScope}
              plain={isHero}
            />
          </Suspense>
        ) : (
          <ScopeChips types={types} scope={scope} onToggle={setScope} plain={isHero} />
        )}
      </div>
    </div>
  );
}

function CountedScopeChips({
  typesPromise,
  scope,
  onToggle,
  plain,
}: {
  typesPromise: Promise<MarketplaceTypeCount[]>;
  scope: string | null;
  onToggle: (value: string | null) => void;
  plain?: boolean;
}) {
  return <ScopeChips types={use(typesPromise)} scope={scope} onToggle={onToggle} plain={plain} />;
}

/**
 * Type filters, not links.
 *
 * They used to navigate straight to `/explore?type=…`, which meant you could
 * not narrow a search you were in the middle of writing. Toggling one now
 * scopes the field instead, so a query runs inside that type — and an empty
 * query with a chip on still lands on that type's listing, which is exactly
 * what the old link did.
 */
function ScopeChips({
  types = [],
  scope,
  onToggle,
  plain = false,
}: {
  types?: MarketplaceTypeCount[];
  scope: string | null;
  onToggle: (value: string | null) => void;
  /** Quiet underlined text instead of pills (the hero). */
  plain?: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <>
      {SHORTCUTS.map((value) => {
        const label = t.homePage.searchShortcuts[value];
        const count = types.find((entry) => entry.type === value)?.products ?? null;
        const isActive = scope === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(isActive ? null : value)}
            className={cn(
              // Sans, not mono: these are filters, and in monospace they read
              // as code tokens rather than as things you can press.
              plain
                ? "inline-flex min-h-11 items-center sm:min-h-8 gap-1 px-1.5 underline underline-offset-4 transition-colors"
                : "inline-flex min-h-11 items-center sm:min-h-8 gap-1.5 rounded-full border px-3.5 text-xs font-medium transition",
              plain
                ? isActive
                  ? "font-semibold text-foreground decoration-foreground"
                  : "text-muted-foreground decoration-border hover:text-foreground hover:decoration-foreground"
                : isActive
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface/60 text-muted-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            {label}
            {count !== null && (
              <span className="font-mono text-xs">· {formatNumber(count, locale)}</span>
            )}
            {isActive && <X size={12} aria-hidden />}
          </button>
        );
      })}
    </>
  );
}
