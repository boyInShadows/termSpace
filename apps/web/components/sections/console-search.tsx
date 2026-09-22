"use client";

import {
  Suspense,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Search, CornerDownLeft, Clock3, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { MarketplaceTypeCount } from "@/lib/types";

const TYPED_INTENTS = [
  "review my pull request like a staff engineer",
  "turn customer interviews into landing page copy",
  "keep sources and caveats visible while researching",
  "audit a schema before it hits production",
  "write release notes people actually read",
] as const;

/** Chip label → the `type` value the catalogue filters on. */
const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ["Skills", "Skill"],
  ["Agents", "Agent"],
  ["MCP servers", "MCP server"],
  ["Prompts", "Prompt"],
  ["Developer tools", "Developer utility"],
];

const RECENT_KEY = "termspace:recent-searches";
const RECENT_LIMIT = 4;

/**
 * Past searches, read through `useSyncExternalStore`.
 *
 * `localStorage` is an external store, and this is the one way to read one
 * that is safe under concurrent rendering and hydrates without a mismatch:
 * the server snapshot is empty, React hydrates against that, then swaps in
 * whatever the browser actually had.
 *
 * Every access is wrapped. Private windows and blocked site data make these
 * throw, and a search box that crashes because it could not recall an old
 * query is a far worse outcome than one that simply does not recall it.
 */
const NO_RECENT: string[] = [];
const recentListeners = new Set<() => void>();

// getSnapshot is called on every render and must return a stable reference
// until the underlying value actually changes, or React re-renders forever.
let cachedRaw: string | null = null;
let cachedRecent: string[] = NO_RECENT;

function getRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw === cachedRaw) return cachedRecent;
    cachedRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedRecent = Array.isArray(parsed)
      ? parsed
          .filter((entry): entry is string => typeof entry === "string")
          .slice(0, RECENT_LIMIT)
      : NO_RECENT;
    return cachedRecent;
  } catch {
    return NO_RECENT;
  }
}

function getServerRecent(): string[] {
  return NO_RECENT;
}

function subscribeRecent(onChange: () => void) {
  recentListeners.add(onChange);
  // Another tab writing the same key should update this one too.
  window.addEventListener("storage", onChange);
  return () => {
    recentListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function rememberQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const next = [trimmed, ...getRecent().filter((q) => q !== trimmed)].slice(
      0,
      RECENT_LIMIT,
    );
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do. Not remembering is an acceptable outcome.
  }
  for (const listener of recentListeners) listener();
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
  const [typed, setTyped] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const recent = useSyncExternalStore(
    subscribeRecent,
    getRecent,
    getServerRecent,
  );
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
      const current = TYPED_INTENTS[phrase];
      char += isDeleting ? -1 : 1;
      setTyped(current.slice(0, char));

      let delay = isDeleting ? 22 : 42;

      if (!isDeleting && char === current.length) {
        // Hold the finished phrase long enough to actually be read.
        delay = 2000;
        isDeleting = true;
      } else if (isDeleting && char === 0) {
        isDeleting = false;
        phrase = (phrase + 1) % TYPED_INTENTS.length;
        delay = 320;
      }

      timerRef.current = window.setTimeout(tick, delay);
    };

    timerRef.current = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timerRef.current);
  }, [prefersReducedMotion, isFocused]);

  // Derived, not synced: while focused or under reduced motion we simply
  // render the resting prompt instead of writing it into state.
  const placeholder =
    prefersReducedMotion || isFocused || typed === null
      ? t.homePage.searchPrompt
      : typed;

  const isHero = variant === "hero";

  const suggestions = recent.length > 0 ? recent : [...TYPED_INTENTS].slice(0, 4);
  const isSuggesting = isFocused && query.trim().length === 0;

  return (
    <div className={isHero ? undefined : "container-page"}>
      <form
        action="/explore"
        onSubmit={() => rememberQuery(query)}
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
            className="ml-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
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
              "min-w-0 flex-1 bg-transparent px-4 text-base placeholder:text-muted-foreground/80 focus:outline-none",
              isHero ? "h-14" : "h-16",
            )}
          />
          <button
            type="submit"
            className="mr-2 hidden h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:flex"
          >
            {t.homePage.searchCta}
            <CornerDownLeft size={14} aria-hidden />
          </button>
          <button
            type="submit"
            aria-label={t.homePage.searchCta}
            className="mr-2 grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary-hover sm:hidden"
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
  return (
    <>
      {SHORTCUTS.map(([label, value]) => {
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
              <span className="font-mono text-[11px] opacity-70">· {count}</span>
            )}
            {isActive && <X size={12} aria-hidden />}
          </button>
        );
      })}
    </>
  );
}
