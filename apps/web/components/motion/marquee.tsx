"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Seconds for one full pass. Larger is slower. */
  duration?: number;
  reverse?: boolean;
};

/**
 * Continuous horizontal ticker. The content is rendered twice and the track
 * translates exactly -50%, so the loop point is seamless. The duplicate is
 * `aria-hidden` — assistive tech reads the list once.
 *
 * Pauses on hover and on keyboard focus so nobody has to chase a moving link.
 *
 * Under reduced motion the animation is switched off entirely rather than
 * sped up to nothing: the global reduced-motion rule collapses every animation
 * to 0.01ms, which would leave this track parked at its end position showing
 * the clone. Instead the clone is dropped, the track sits still, and the strip
 * becomes horizontally scrollable so the content past the edge is still
 * reachable.
 */
export function Marquee({ children, className, duration = 42, reverse }: Props) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        "[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
        "motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max shrink-0 animate-marquee gap-4",
          "group-hover:[animation-play-state:paused]",
          "group-focus-within:[animation-play-state:paused]",
          "motion-reduce:[animation:none]",
          reverse && "[animation-direction:reverse]",
        )}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4 motion-reduce:hidden" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
