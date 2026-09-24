"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { HeroAtmosphere } from "./hero-atmosphere";
import { HeroScene } from "./hero-scene";
import { Marquee } from "@/components/motion/marquee";
import { ConsoleSearch } from "@/components/sections/console-search";
import { buttonVariants } from "@/components/ui/button";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";
import { useLocale } from "@/lib/locale-context";
import type { MarketplaceTypeCount } from "@/lib/types";

/**
 * The ticker's source of truth: unique names, grouped by what they actually
 * are. MCP and "Raw API" are protocols, not products, and listing them beside
 * Claude and Cursor invited the reader to read the whole strip as a list of
 * apps. Group labels also make the loop legible — when "Models" comes back
 * round it reads as the list repeating, not as a duplicated entry.
 */
/** Page-load entrance order: eyebrow → h1 → intro → search → card. */
const enter = (index: number) => ({ "--enter-i": index }) as CSSProperties;

const WORKS_WITH = [
  { key: "worksWithModels", items: ["Claude", "ChatGPT", "Gemini"] },
  { key: "worksWithEditors", items: ["Cursor", "VS Code", "Codex"] },
  { key: "worksWithProtocols", items: ["MCP", "Raw API"] },
] as const;

export function Hero({
  types,
}: {
  types?: Promise<MarketplaceTypeCount[]>;
}) {
  const { t } = useLocale();
  // Writes --progress on the section; the 3D stage reads it to rotate and
  // rise as the hero leaves, so scroll and cursor drive the same object.
  const sectionRef = useScrollProgress<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-b border-border"
    >
      {/* --- atmosphere ---------------------------------------------------- */}
      <div className="absolute inset-0 -z-10">
        <HeroAtmosphere />
      </div>
      <div
        aria-hidden
        className="grid-field absolute inset-0 -z-10 opacity-60"
        style={{
          maskImage:
            "radial-gradient(120% 90% at 50% 0%, black, transparent 72%)",
        }}
      />
      {/* Readability scrim. The field is deliberately quiet, but "quiet" is a
          statistical claim about noise — a bright filament can still land
          under a word. This guarantees the copy always has ground beneath it.
          Two variants, because the layout rotates: on wide screens the copy
          sits beside the scene so the scrim runs left-to-right, and on narrow
          screens it stacks above it, so a horizontal scrim would cover the
          whole hero and there would be no atmosphere left to see. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background from-30% via-background/70 to-transparent lg:hidden"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 -z-10 hidden w-[72%] bg-gradient-to-r from-background from-45% via-background/85 via-75% to-transparent lg:block"
      />
      {/* Grounds the hero into the page instead of ending it on a hard edge. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background"
      />

      {/* ~80vh once the header, announcement strip and ticker are counted,
          so the featured row is visible without a deliberate scroll. */}
      <div className="container-page relative grid items-center gap-14 py-16 lg:min-h-[66vh] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:py-20">
        {/* --- copy -------------------------------------------------------- */}
        <div>
          <p className="ts-enter eyebrow flex items-center gap-2" style={enter(0)}>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-accent opacity-75 [animation:ts-pulse-ring_2.4s_ease-out_infinite]" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {t.marketplace}
          </p>

          {/* The LCP element. It paints its final text at once: no scramble,
              which delayed the final paint and broke Persian joins. */}
          <h1
            className="ts-enter editorial mt-6 text-[clamp(2.6rem,1.2rem+5.6vw,4.9rem)] font-medium leading-[0.98] tracking-[-0.03em]"
            style={enter(1)}
            data-enter="nudge"
          >
            <span className="block">{t.heroStop}</span>
            <span className="block">{t.heroScratch}</span>
            <span className="mt-1 block text-plasma">{t.heroStart}</span>
          </h1>

          <p
            className="ts-enter mt-6 max-w-xl text-lg leading-8 text-muted-foreground"
            style={enter(2)}
            data-enter="nudge"
          >
            {t.heroIntro}
          </p>

          {/* The primary action. This is a library: the thing almost everyone
              arrived to do is search it, so the field sits here rather than
              below the fold under a marquee. "Explore community resources" was
              a button that led to the same search one screen further down. */}
          <div className="ts-enter mt-8" style={enter(3)}>
            <ConsoleSearch variant="hero" types={types} />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "secondary" })}
            >
              <Sparkles size={16} />
              {t.shareWork}
            </Link>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck size={15} className="text-verified" />
              {t.declared}
            </p>
          </div>
        </div>

        {/* --- 3D scene ----------------------------------------------------- */}
        <div className="ts-enter relative" style={enter(4)}>
          <HeroScene />
        </div>
      </div>

      {/* --- platform ticker ------------------------------------------------ */}
      <div className="relative border-t border-border/70 bg-background/50 py-4 backdrop-blur">
        <div className="container-page flex items-center gap-6">
          <span className="eyebrow hidden shrink-0 sm:block">
            {t.worksWith}
          </span>
          <Marquee duration={64} className="min-w-0 flex-1">
            {WORKS_WITH.map((group) => (
              <span key={group.key} className="flex items-center">
                <span className="eyebrow whitespace-nowrap px-4">
                  {t.homePage[group.key]}
                </span>
                {group.items.map((platform) => (
                  <span
                    key={platform}
                    className="flex items-center gap-2 whitespace-nowrap px-4 font-mono text-sm text-muted-foreground"
                  >
                    <span className="size-1 rounded-full bg-accent/70" />
                    {platform}
                  </span>
                ))}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
