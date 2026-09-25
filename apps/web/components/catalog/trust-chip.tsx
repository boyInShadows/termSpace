import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One trust claim, stated the same way everywhere: the hero's corner chips
 * and the detail page header use this, so the promise on the homepage and
 * the product it describes look like the same thing.
 */
export function TrustChip({
  icon,
  label,
  sub,
  className,
  style,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("panel flex items-center gap-2 rounded-xl px-2.5 py-2 shadow-lift", className)} style={style}>
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted/70">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[11px] font-semibold">{label}</span>
        {/* Tracking and capitals pull a joined script apart. */}
        <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground rtl:font-sans rtl:normal-case rtl:tracking-normal">
          {sub}
        </span>
      </span>
    </div>
  );
}
