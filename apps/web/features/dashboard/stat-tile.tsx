import { cn } from "@/lib/utils";
import { Skeleton } from "./dashboard-card";

const TILE = "rounded-[var(--radius-card)] border border-border bg-surface p-5";

export type StatDelta = {
  /** Signed change against the previous period. */
  value: number;
  /** The change as formatted text, without a sign — the arrow carries it. */
  display: string;
  /** Full sentence for assistive tech; the arrow and colour alone say nothing. */
  description: string;
};

/**
 * A number, its label and, when the API reports a comparison period, how it
 * moved. No sparkline: the API reports window totals, not a series.
 */
export function StatTile({ label, value, delta }: { label: string; value: string; delta?: StatDelta }) {
  return (
    <div className={`${TILE} transition-colors duration-[var(--duration-fast)] hover:bg-surface-raised`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-semibold leading-9 tabular-nums">{value}</span>
        {delta && <DeltaBadge delta={delta} />}
      </dd>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: StatDelta }) {
  const arrow = delta.value > 0 ? "▲" : delta.value < 0 ? "▼" : "—";
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums",
        delta.value > 0 && "text-success",
        delta.value < 0 && "text-destructive",
        delta.value === 0 && "text-muted-foreground",
      )}
    >
      <span aria-hidden>
        {arrow}
        {delta.value !== 0 && ` ${delta.display}`}
      </span>
      <span className="sr-only">{delta.description}</span>
    </span>
  );
}

/** Same box, same line heights, so swapping it for the real tile moves nothing. */
export function StatTileSkeleton() {
  return (
    <div className={TILE} aria-hidden>
      <Skeleton className="h-[1.1rem] w-24" />
      <Skeleton className="mt-3 h-9 w-16" />
    </div>
  );
}
