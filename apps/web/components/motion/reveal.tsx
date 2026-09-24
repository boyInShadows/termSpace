"use client";

import type { ElementType, ReactNode } from "react";
import { useInView } from "@/lib/hooks/use-in-view";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger offset in ms — hand each sibling an increasing index. */
  delay?: number;
  /** Travel distance before settling. */
  distance?: number;
  as?: ElementType;
};

/**
 * Scroll-triggered entrance. The element is laid out normally and only its
 * opacity and transform animate, so a reveal never shifts the page (CLS 0).
 * Under reduced motion the CSS animation collapses to ~0ms via the global
 * media query, leaving the element visible and static.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 16,
  as: Tag = "div",
}: Props) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      data-revealed={isInView ? "" : undefined}
      className={cn("ts-reveal", className)}
      style={{
        "--rise-from": `${distance}px`,
        "--rise-delay": `${delay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
