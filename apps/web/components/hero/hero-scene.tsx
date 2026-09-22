"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Lock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { pointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

/**
 * The tangible half of the hero.
 *
 * This is genuine 3D, not a skew: a `preserve-3d` stage under a perspective,
 * with each panel pushed to its own `translateZ`. Because the browser divides
 * by depth, the parallax between the layers is real geometry rather than a
 * per-layer multiplier we tuned by hand. Rotating the stage is enough.
 *
 * What it shows is deliberate. The product's whole argument is that trust is
 * product information, so the hero object is a manifest: what this thing
 * touches, what it needs, and who checked it.
 */

const MANIFEST: ReadonlyArray<readonly [string, string]> = [
  ["type", "Skill · v2.4.0"],
  ["platforms", "Claude · ChatGPT · Codex"],
  ["permissions", "reads selection · no network"],
  ["license", "MIT"],
  ["reviewed", "safety pass · 2 days ago"],
];

export function HeroScene() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const unsubscribe = subscribePointer(() => {
      // pointer.x / pointer.y are already eased, so the stage has weight and
      // keeps drifting for a moment after the cursor stops.
      stage.style.setProperty("--rx", `${(-pointer.y * 9).toFixed(2)}deg`);
      stage.style.setProperty("--ry", `${(pointer.x * 13).toFixed(2)}deg`);
    });

    return () => {
      unsubscribe();
      stage.style.removeProperty("--rx");
      stage.style.removeProperty("--ry");
    };
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto w-full max-w-lg select-none px-2 [perspective:1500px] [perspective-origin:50%_45%] sm:px-0"
    >
      <div
        ref={stageRef}
        /* The stage height is aspect-driven while the panel inside it is
           content-driven, so the ratio has to leave room for the tallest the
           panel gets. On narrow screens the manifest rows are the same height
           but the box is much shorter, so the panel would otherwise run past
           the bottom edge and the corner chips would land on top of it. */
        className="ts-stage relative aspect-[4/5] w-full [transform-style:preserve-3d] sm:aspect-[4/3.6]"
      >
        {/* --- back plane: the grid the object floats above ------------- */}
        <div
          className="grid-field absolute inset-x-[-14%] inset-y-[-6%] rounded-3xl opacity-70"
          style={{
            transform: "translateZ(-180px) rotateX(58deg) translateY(22%)",
            maskImage:
              "radial-gradient(closest-side, black, transparent 78%)",
          }}
        />

        {/* --- halo: sits just behind the panel so the glass reads as lit -- */}
        <div
          className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            transform: "translateZ(-70px)",
            background:
              "conic-gradient(from 210deg, var(--primary), var(--spark), var(--accent), var(--primary))",
            opacity: 0.42,
          }}
        />

        {/* --- the manifest panel, with its chips anchored to its corners --
            The chips used to be positioned against the stage, which is an
            aspect box rather than the card, so their offsets drifted with the
            viewport and they read as scattered across the nebula. Sharing a
            wrapper with the panel means "16px outside the top-right corner"
            stays that at every width. */}
        <div
          className="absolute inset-x-[6%] top-[10%] [transform-style:preserve-3d]"
          style={{ transform: "translateZ(0px)" }}
        >
          <div className="panel overflow-hidden rounded-2xl shadow-lift">
            {/* title bar */}
            <div className="flex items-center gap-2 border-b border-border/80 bg-surface-raised/60 px-4 py-2.5">
              <span className="size-2 rounded-full bg-destructive/70" />
              <span className="size-2 rounded-full bg-warning/70" />
              <span className="size-2 rounded-full bg-verified/70" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                termspace · inspect
              </span>
            </div>

            <div className="px-4 py-4 font-mono text-[11.5px] leading-6 sm:text-xs">
              <p className="truncate text-muted-foreground">
                <span className="text-accent">$</span> termspace inspect{" "}
                <span className="text-foreground">conversion-copywriter</span>
              </p>

              <div className="mt-3 space-y-1">
                {MANIFEST.map(([key, value]) => (
                  <div key={key} className="flex gap-3">
                    <span className="w-24 shrink-0 text-muted-foreground">
                      {key}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground/90">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-verified">
                <ShieldCheck size={13} />
                <span>all declared surfaces accounted for</span>
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-accent align-middle" />
              </p>
            </div>
          </div>

          {/* --- three chips, one per corner ---------------------------
              Down from five. Price and rating were the two that had to go:
              "$38 one-time" contradicts a freely-shared community library
              outright, and a star rating is a popularity signal, not a
              trust one. What is left restates the page's actual claim —
              reviewed, scoped, versioned — and each chip sits at a fixed
              offset from a corner of the card rather than floating loose
              in the nebula.

              Depth still differs per chip so the stage's cursor-driven
              rotation parallaxes them against the panel. That rotation is
              already skipped under reduced motion and on coarse pointers;
              the idle drift is stopped by the global reduced-motion rule. */}
          <FloatChip
            className="-right-3 -top-3 sm:-right-5 sm:-top-5"
            z={132}
            delay="0s"
            icon={<ShieldCheck size={12} className="text-verified" />}
            label="Verified"
            sub="safety reviewed"
          />
          <FloatChip
            className="-bottom-3 -left-3 sm:-bottom-5 sm:-left-5"
            z={112}
            delay="1.4s"
            icon={<Lock size={12} className="text-accent" />}
            label="No network"
            sub="permission scope"
          />
          <FloatChip
            className="-bottom-3 -right-3 sm:-bottom-5 sm:-right-5"
            z={64}
            delay="2.8s"
            icon={<GitBranch size={12} className="text-primary" />}
            label="v2.4.0"
            sub="12 versions"
          />
        </div>
      </div>
    </div>
  );
}

type ChipProps = {
  className: string;
  z: number;
  delay: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
};

function FloatChip({ className, z, delay, icon, label, sub }: ChipProps) {
  return (
    <div
      // Hidden below md. On a phone the card fills the column and there is no
      // margin for a chip to sit outside it without landing on the manifest
      // text — and every claim these make is already a row in that manifest.
      className={cn("absolute hidden md:block", className)}
      style={{ transform: `translateZ(${z}px)` }}
    >
      <div
        className="animate-drift panel flex items-center gap-2 rounded-xl px-2.5 py-2 shadow-lift"
        style={{ animationDelay: delay }}
      >
        <span className="grid size-6 place-items-center rounded-md bg-muted/70">
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold">{label}</span>
          <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {sub}
          </span>
        </span>
      </div>
    </div>
  );
}
