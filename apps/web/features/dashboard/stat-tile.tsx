import { cn } from "@/lib/utils";
import { Skeleton } from "./dashboard-card";

const TILE = "border-t-[length:0.0625rem] border-border pt-4";

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
export function StatTile({ label, value, delta, context }: { label: string; value: string; delta?: StatDelta; context?: string }) {
  return (
    <div className={TILE}>
      <dt className="min-h-10 text-xs font-medium leading-5 text-muted-foreground sm:min-h-5">{label}</dt>
      <dd className="mt-2">
        <span className="block break-all text-3xl font-semibold leading-9 tabular-nums">{value}</span>
        {(delta || context) && <span className="mt-2 block text-xs leading-5 text-muted-foreground">
          {delta && <DeltaBadge delta={delta} />}
          {context}
        </span>}
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
      <span aria-hidden className="me-1">{arrow}</span>
      <span>{delta.description}</span>
    </span>
  );
}

/** Match the ready tile's spacing and line heights while its content loads. */
export function StatTileSkeleton() {
  return (
    <div className={TILE} aria-hidden>
      <Skeleton className="h-10 w-24 sm:h-5" />
      <Skeleton className="mt-2 h-9 w-16" />
      <Skeleton className="mt-2 h-5 w-full" />
    </div>
  );
}
