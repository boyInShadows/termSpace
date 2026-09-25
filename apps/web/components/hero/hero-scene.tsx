"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Lock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { pointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { TrustChip } from "@/components/catalog/trust-chip";
import { useLocale } from "@/lib/locale-context";
import {
  ManifestCard,
  SequenceControls,
  useManifestSequence,
} from "./manifest-sequence";

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
 * touches, what it needs, and who checked it. Once the page has loaded, the
 * card performs the journey it describes — search, inspect, install — once
 * (manifest-sequence.tsx), and each chip lands with the line that earns it.
 */

export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const sequence = useManifestSequence(sceneRef);
  const { t } = useLocale();

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
      ref={sceneRef}
      className="group/scene relative mx-auto w-full max-w-lg"
    >
      <div
        aria-hidden
        className="pointer-events-none relative w-full select-none px-2 [perspective:1500px] [perspective-origin:50%_45%] sm:px-0"
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

          {/* --- halo: sits just behind the panel so the glass reads as lit --
            Three overlapping radial gradients rather than a conic gradient
            under `blur-3xl`. `filter: blur()` on an element this size is a
            full-surface raster pass on every frame the stage rotates, and it
            rotates with the cursor; radial gradients are painted once and
            cost nothing to transform. The result is the same wash, because a
            64px blur of a conic sweep is exactly this. */}
          <div
            className="absolute left-1/2 top-1/2 size-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              transform: "translateZ(-70px)",
              backgroundImage: [
                "radial-gradient(55% 55% at 28% 24%, color-mix(in oklab, var(--primary) 85%, transparent), transparent 72%)",
                "radial-gradient(55% 55% at 76% 34%, color-mix(in oklab, var(--spark) 80%, transparent), transparent 72%)",
                "radial-gradient(60% 60% at 50% 84%, color-mix(in oklab, var(--accent) 70%, transparent), transparent 74%)",
              ].join(","),
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
            <ManifestCard
              frame={sequence.frame}
              className="pointer-events-auto"
              {...sequence.hoverHandlers}
            />

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
              shown={sequence.frame.chips.verified}
              icon={<ShieldCheck size={12} className="text-verified" />}
              label={t.homePage.heroChips.verified.label}
              sub={t.homePage.heroChips.verified.sub}
            />
            <FloatChip
              className="-bottom-3 -left-3 sm:-bottom-5 sm:-left-5"
              z={112}
              delay="1.4s"
              shown={sequence.frame.chips.network}
              icon={<Lock size={12} className="text-accent" />}
              label={t.homePage.heroChips.network.label}
              sub={t.homePage.heroChips.network.sub}
            />
            <FloatChip
              className="-bottom-3 -right-3 sm:-bottom-5 sm:-right-5"
              z={64}
              delay="2.8s"
              shown={sequence.frame.chips.version}
              icon={<GitBranch size={12} className="text-primary" />}
              label="v2.4.0"
              sub={t.homePage.heroChips.versions}
            />
          </div>
        </div>
      </div>
      <SequenceControls sequence={sequence} />
    </div>
  );
}

type ChipProps = {
  className: string;
  z: number;
  delay: string;
  /** False until the sequence reaches the manifest line this chip restates. */
  shown: boolean;
  icon: React.ReactNode;
  label: string;
  sub: string;
};

function FloatChip({
  className,
  z,
  delay,
  shown,
  icon,
  label,
  sub,
}: ChipProps) {
  return (
    <div
      // Hidden below md. On a phone the card fills the column and there is no
      // margin for a chip to sit outside it without landing on the manifest
      // text — and every claim these make is already a row in that manifest.
      className={cn("ts-chip absolute hidden md:block", className)}
      data-on={shown}
      style={{ transform: `translateZ(${z}px)` }}
    >
      <TrustChip
        className="animate-drift"
        style={{ animationDelay: delay }}
        icon={icon}
        label={label}
        sub={sub}
      />
    </div>
  );
}
