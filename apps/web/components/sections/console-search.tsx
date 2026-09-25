"use client";

import { Suspense, use, useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft, Clock3, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useStoredString } from "@/lib/hooks/use-stored-string";
import type { MarketplaceTypeCount } from "@/lib/types";

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
 * The placeholder types itself through real user intents on a loop. That is
 * the hook: it teaches you to search by outcome instead of by file format,
 * which is the whole premise of the catalogue, without a line of instruction
 * copy. It stops the moment you focus the field, so it never types over
 * someone who is trying to think — and it is purely decorative to assistive
 * tech, which reads the field's stable `aria-label` instead of a placeholder
 * that rewrites itself every 40ms.
 *
 * Two placements. `hero` sits in the hero's copy column as the page's primary
 * action — this is a library, so search is the thing most people came to do,
 * and it does not belong below the fold. `band` is the wider standalone strip
 * used anywhere else on the site.
 */
export function ConsoleSearch({
  variant = "band",
  types,
}: {
  variant?: "hero" | "band";
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
  const { t } = useLocale();
  const intents = t.homePage.typedIntents;
  const [typed, setTyped] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [storedRecent, setStoredRecent] = useStoredString(RECENT_KEY);
  const recent = useMemo(() => parseRecent(storedRecent), [storedRecent]);
  const [query, setQuery] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<number>(0);
  const suggestionsId = useId();

  useEffect(() => {
    if (prefersReducedMotion || isFocused) return;

    let phrase = 0;
    let char = 0;
    let isDeleting = false;

    const tick = () => {
      const current = intents[phrase];
      char += isDeleting ? -1 : 1;
      setTyped(current.slice(0, char));

      let delay = isDeleting ? 22 : 42;

      if (!isDeleting && char === current.length) {
        // Hold the finished phrase long enough to actually be read.
        delay = 2000;
        isDeleting = true;
      } else if (isDeleting && char === 0) {
        isDeleting = false;
        phrase = (phrase + 1) % intents.length;
        delay = 320;
      }

      timerRef.current = window.setTimeout(tick, delay);
    };

    timerRef.current = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timerRef.current);
  }, [prefersReducedMotion, isFocused, intents]);

  // Derived, not synced: while focused or under reduced motion we simply
  // render the resting prompt instead of writing it into state.
  const placeholder =
    prefersReducedMotion || isFocused || typed === null
      ? t.homePage.searchPrompt
      : typed;

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

  const suggestions = recent.length > 0 ? recent : [...intents].slice(0, 4);
  const isSuggesting = isFocused && query.trim().length === 0;

  return (
    <div className={isHero ? undefined : "container-page"}>
      <form
        action="/explore"
        onSubmit={() => remember(query)}
        className={cn("group relative", isHero ? "max-w-xl" : "mx-auto max-w-3xl")}
      >
        {/* Plasma bloom behind the field — the only place on the page where
            the brand gradient touches a form control. */}
        <div
          aria-hidden
          className="absolute -inset-px rounded-xl opacity-0 blur-md transition-opacity duration-500 group-focus-within:opacity-70"
          style={{
            background:
              "linear-gradient(100deg, var(--primary), var(--spark), var(--accent))",
          }}
        />

        {/* The active scope travels with the form, so pressing Enter searches
            inside it and an empty query still lands on that type's listing. */}
        {scope && <input type="hidden" name="type" value={scope} />}

        <div className="relative flex items-center rounded-xl border border-border-strong bg-surface/90 shadow-soft backdrop-blur transition-colors focus-within:border-transparent">
          <Search
            size={19}
            className="ms-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
            aria-hidden
          />
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // A stable name for the field. The placeholder rewrites itself
            // every 40ms, and a screen reader with no explicit label would
            // fall back to it and re-announce a half-typed sentence on every
            // keystroke.
            aria-label={t.homePage.searchLabel}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={isSuggesting}
            aria-controls={suggestionsId}
            onFocus={() => setIsFocused(true)}
            // Blur is deferred so a click on a suggestion lands before the
            // list unmounts.
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            className={cn(
              "min-w-0 flex-1 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none",
              isHero ? "h-14" : "h-16",
            )}
          />
          <button
            type="submit"
            className="me-2 hidden h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:flex"
          >
            {t.homePage.searchCta}
            <CornerDownLeft size={14} aria-hidden />
          </button>
          <button
            type="submit"
            aria-label={t.homePage.searchCta}
            className="me-2 grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary-hover sm:hidden"
          >
            <Search size={17} aria-hidden />
          </button>
        </div>

        {isSuggesting && (
          <ul
            id={suggestionsId}
            role="listbox"
            aria-label={
              recent.length > 0
                ? t.homePage.recentSearches
                : t.homePage.popularSearches
            }
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lift"
          >
            <li className="eyebrow px-4 pb-1 pt-3">
              {recent.length > 0
                ? t.homePage.recentSearches
                : t.homePage.popularSearches}
            </li>
            {suggestions.map((suggestion) => (
              <li key={suggestion} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setQuery(suggestion)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition-colors hover:bg-muted"
                >
                  {recent.length > 0 ? (
                    <Clock3 size={14} className="shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <Sparkles size={14} className="shrink-0 text-accent" aria-hidden />
                  )}
                  <span className="min-w-0 truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div
        className={cn(
          "mt-5 flex flex-wrap gap-2",
          isHero ? "justify-start" : "justify-center",
        )}
      >
        {types && !Array.isArray(types) ? (
          <Suspense fallback={<ScopeChips scope={scope} onToggle={setScope} />}>
            <CountedScopeChips
              typesPromise={types}
              scope={scope}
              onToggle={setScope}
            />
          </Suspense>
        ) : (
          <ScopeChips types={types} scope={scope} onToggle={setScope} />
        )}
      </div>
    </div>
  );
}

function CountedScopeChips({
  typesPromise,
  scope,
  onToggle,
}: {
  typesPromise: Promise<MarketplaceTypeCount[]>;
  scope: string | null;
  onToggle: (value: string | null) => void;
}) {
  return <ScopeChips types={use(typesPromise)} scope={scope} onToggle={onToggle} />;
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
}: {
  types?: MarketplaceTypeCount[];
  scope: string | null;
  onToggle: (value: string | null) => void;
}) {
  const { t } = useLocale();
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
              "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition",
              isActive
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface/60 text-muted-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            {label}
            {count !== null && (
              <span className="font-mono text-xs">· {count}</span>
            )}
            {isActive && <X size={12} aria-hidden />}
          </button>
        );
      })}
    </>
  );
}
