"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const SUGGESTIONS = [
  "review my pull request like a staff engineer",
  "turn customer interviews into landing page copy",
  "keep sources and caveats visible while researching",
  "audit a schema before it hits production",
  "write release notes people actually read",
] as const;

const SHORTCUTS = [
  ["Skills", "Skill"], ["Agents", "Agent"], ["MCP servers", "MCP server"],
  ["Prompts", "Prompt"], ["Developer tools", "Developer utility"],
] as const;

/**
 * The search bar, treated as the product's command line rather than as a
 * form field.
 *
 * The placeholder types itself through real user intents on a loop. That is
 * the hook: it teaches you to search by outcome instead of by file format,
 * which is the whole premise of the catalogue, without a line of instruction
 * copy. It stops the moment you focus the field, so it never types over
 * someone who is trying to think.
 */
export function ConsoleSearch() {
  const [typed, setTyped] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion || isFocused) return;

    let phrase = 0;
    let char = 0;
    let isDeleting = false;

    const tick = () => {
      const current = SUGGESTIONS[phrase];
      char += isDeleting ? -1 : 1;
      setTyped(current.slice(0, char));

      let delay = isDeleting ? 22 : 42;

      if (!isDeleting && char === current.length) {
        // Hold the finished phrase long enough to actually be read.
        delay = 2000;
        isDeleting = true;
      } else if (isDeleting && char === 0) {
        isDeleting = false;
        phrase = (phrase + 1) % SUGGESTIONS.length;
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
      ? "What do you want AI to do better?"
      : typed;

  return (
    <div className="container-page">
      <form action="/explore" className="group relative mx-auto max-w-3xl">
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

        <div className="relative flex items-center rounded-xl border border-border-strong bg-surface/90 shadow-soft backdrop-blur transition-colors focus-within:border-transparent">
          <Search
            size={19}
            className="ml-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
          <input
            name="q"
            aria-label="Search community resources by outcome"
            placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="h-16 min-w-0 flex-1 bg-transparent px-4 text-base placeholder:text-muted-foreground/80 focus:outline-none"
          />
          <button
            type="submit"
            className="mr-2 hidden h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:flex"
          >
            Search
            <CornerDownLeft size={14} />
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SHORTCUTS.map(([label, value]) => (
          <Link
            key={value}
            href={`/explore?type=${encodeURIComponent(value)}`}
            className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 font-mono text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
