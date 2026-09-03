"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PlasmaField } from "./plasma-field";
import { HeroScene } from "./hero-scene";
import { DecodeText } from "@/components/motion/decode-text";
import { Magnetic } from "@/components/motion/magnetic";
import { Marquee } from "@/components/motion/marquee";
import { buttonVariants } from "@/components/ui/button";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";
import { useLocale } from "@/lib/locale-context";

const PLATFORMS = [
  "Claude",
  "ChatGPT",
  "Cursor",
  "Codex",
  "VS Code",
  "Gemini",
  "MCP",
  "Raw API",
] as const;

export function Hero() {
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
        <PlasmaField />
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

      <div className="container-page relative grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:py-28">
        {/* --- copy -------------------------------------------------------- */}
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-accent opacity-75 [animation:ts-pulse-ring_2.4s_ease-out_infinite]" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {t.marketplace}
          </p>

          <h1 className="editorial mt-6 text-[clamp(2.6rem,1.2rem+5.6vw,4.9rem)] font-medium leading-[0.98] tracking-[-0.03em]">
            <span className="block">{t.heroStop}</span>
            <span className="block">{t.heroScratch}</span>
            <DecodeText
              text={t.heroStart}
              className="mt-1 block"
              textClassName="text-plasma"
              delay={420}
              speed={26}
            />
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            {t.heroIntro}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href="/explore"
                className={`${buttonVariants({ size: "lg" })} group shadow-plasma`}
              >
                {t.exploreMarketplace}
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <Magnetic strength={9}>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                <Sparkles size={16} />
                {t.sellWork}
              </Link>
            </Magnetic>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={15} className="text-verified" />
            {t.declared}
          </p>
        </div>

        {/* --- 3D scene ----------------------------------------------------- */}
        <div className="relative">
          <HeroScene />
        </div>
      </div>

      {/* --- platform ticker ------------------------------------------------ */}
      <div className="relative border-t border-border/70 bg-background/50 py-4 backdrop-blur">
        <div className="container-page flex items-center gap-6">
          <span className="eyebrow hidden shrink-0 sm:block">
            {t.worksWith}
          </span>
          <Marquee duration={38} className="min-w-0 flex-1">
            {PLATFORMS.map((platform) => (
              <span
                key={platform}
                className="flex items-center gap-2 whitespace-nowrap px-4 font-mono text-sm text-muted-foreground"
              >
                <span className="size-1 rounded-full bg-accent/70" />
                {platform}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
