import { Skeleton } from "./dashboard-card";

const TILE = "rounded-[var(--radius-card)] border border-border bg-surface p-5";

/**
 * A number and its label. No sparkline and no delta: the API reports totals,
 * not a time series, and a trend arrow without one would be invented.
 */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${TILE} transition-colors duration-[var(--duration-fast)] hover:bg-surface-raised`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-3 text-3xl font-semibold leading-9 tabular-nums">{value}</dd>
    </div>
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
