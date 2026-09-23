"use client";
import { Archive, GitBranch, ShieldCheck, TriangleAlert } from "lucide-react";
import { lifecycleActionLabel } from "@/features/creator/creator-dashboard";
import { activityTone, collectActivity, formatRelative, type ActivityTone } from "@/lib/dashboard";
import { useLocale } from "@/lib/locale-context";
import { CardError, DashboardCard, Skeleton } from "./dashboard-card";
import type { OverviewState } from "./overview-state";

const TONE_ICON: Record<ActivityTone, React.ReactElement> = {
  positive: <ShieldCheck className="size-3 text-success" />,
  attention: <TriangleAlert className="size-3 text-warning" />,
  progress: <GitBranch className="size-3 text-primary" />,
  neutral: <Archive className="size-3 text-muted-foreground" />,
};

const ITEMS_WHILE_LOADING = 4;

/**
 * The icon sits centred on the rail: the list's padding (24px) plus half the
 * 20px marker, minus half the 1px border, measured from the item's start edge.
 * Logical `start`, so the rail moves to the right in Persian.
 */
const MARKER = "absolute -start-[34.5px] top-0.5 grid size-5 place-items-center rounded-full border border-border bg-surface";

export function ActivityFeed({ state, now, onRetry }: { state: OverviewState; now: number; onRetry: () => void }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const localeTag = locale === "fa" ? "fa-IR" : "en-US";

  if (state.status === "error") {
    return (
      <DashboardCard title={copy.activityTitle}>
        <CardError onRetry={onRetry} />
      </DashboardCard>
    );
  }

  const items =
    state.status === "ready" && state.home.kind === "creator"
      ? collectActivity(state.home.dashboard.listings)
      : [];

  return (
    <DashboardCard title={copy.activityTitle}>
      <div className="px-5 pb-5">
        {state.status === "loading" ? (
          <ol aria-hidden className="relative ms-2.5 space-y-4 border-s border-border ps-6">
            {Array.from({ length: ITEMS_WHILE_LOADING }, (_, index) => (
              <li key={index} className="relative">
                <span className={MARKER} />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </li>
            ))}
          </ol>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.emptyActivity}</p>
        ) : (
          <ol className="relative ms-2.5 space-y-4 border-s border-border ps-6">
            {items.map((item) => (
              <li key={item.id} className="relative text-sm">
                <span aria-hidden className={MARKER}>{TONE_ICON[activityTone(item.action)]}</span>
                <p>
                  <span className="font-medium">{item.listingName}</span>
                  <span className="text-muted-foreground"> · {lifecycleActionLabel(item.action, t.creatorHub)}</span>
                </p>
                <time dateTime={item.createdAt} className="mt-0.5 block font-mono text-xs text-muted-foreground">
                  {formatRelative(item.createdAt, now, localeTag)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </DashboardCard>
  );
}
