"use client";
import { useCallback, useEffect, useState } from "react";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { getDashboardHome, greetingPeriod, type DashboardHome } from "@/lib/dashboard";
import { useLocale } from "@/lib/locale-context";
import { ActivityFeed } from "./activity-feed";
import { Skeleton } from "./dashboard-card";
import { ListingsTable } from "./listings-table";
import type { OverviewState } from "./overview-state";
import { QuickActions } from "./quick-actions";
import { StatTile, StatTileSkeleton, type StatDelta } from "./stat-tile";
import { intlLocale } from "@/lib/format";
import { CardError } from "./dashboard-card";

/** Fetches the overview once, and again on Retry. */
export function DashboardOverview({ initialHome }: { initialHome?: { email: string; home: DashboardHome } }) {
  const session = useMarketplaceSession();
  const [state, setState] = useState<OverviewState>(() => initialHome?.email === session.email ? { status: "ready", home: initialHome.home } : { status: "loading" });
  const [reload, setReload] = useState(0);
  // The first render must not depend on the server's timezone.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getDashboardHome(controller.signal)
      .then((home) => { setNow(Date.now()); setState({ status: "ready", home }); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Dashboard overview failed to load", cause);
        setNow(Date.now());
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [reload]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setReload((value) => value + 1);
  }, []);

  const emailName = session.email?.split("@")[0] ?? "";
  const name = state.status === "ready" && state.home.kind === "creator" ? state.home.profile.name : emailName;

  return <OverviewLayout state={state} now={now ?? 0} name={now === null ? undefined : name} onRetry={retry} />;
}

/** The route-level skeleton: the real layout, held in its loading state. */
export function DashboardOverviewSkeleton() {
  return <OverviewLayout state={{ status: "loading" }} now={0} onRetry={() => {}} />;
}

function OverviewLayout({
  state,
  now,
  name,
  onRetry,
}: {
  state: OverviewState;
  now: number;
  /** Undefined only in the route skeleton, before anyone is known. */
  name?: string;
  onRetry: () => void;
}) {
  const datedPanels: OverviewState = now === 0 ? { status: "loading" } : state;
  const loading = state.status === "loading" || (state.status === "ready" && now === 0);
  return (
    <div className="space-y-8" aria-busy={loading}>
      {loading && <LoadingStatus />}
      <OverviewHeader state={state} now={now} name={name} />
      <OverviewStats state={state} />
      {state.status === "error" ? <div className="space-y-6"><CardError onRetry={onRetry} /><QuickActions /></div> : <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ListingsTable state={datedPanels} now={now} onRetry={onRetry} />
        <div className="space-y-6">
          <ActivityFeed state={datedPanels} now={now} onRetry={onRetry} />
          <QuickActions />
        </div>
      </div>}
    </div>
  );
}

/** Skeletons are aria-hidden, so this is what a screen reader hears instead. */
function LoadingStatus() {
  const { t } = useLocale();
  return (
    <p className="sr-only" role="status">
      {t.dashboardHome.loading}
    </p>
  );
}

function OverviewHeader({ state, now, name }: { state: OverviewState; now: number; name?: string }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const localeTag = intlLocale(locale);
  const number = new Intl.NumberFormat(localeTag);
  const known = name !== undefined;

  const greeting = {
    morning: copy.greetingMorning,
    afternoon: copy.greetingAfternoon,
    evening: copy.greetingEvening,
  }[greetingPeriod(new Date(now).getHours())];

  let summary: string | null = null;
  if (state.status === "error") summary = copy.summaryError;
  if (state.status === "ready" && state.home.kind === "no-profile") summary = copy.summaryEmpty;
  if (state.status === "ready" && state.home.kind === "creator") {
    const totals = state.home.dashboard.summary;
    summary = totals.totalListings === 0
      ? copy.summaryEmpty
      : copy.summary
          .replace("{week}", number.format(totals.acquisitionsLast7Days))
          .replace("{review}", number.format(totals.inReviewListings))
          .replace("{acquisitions}", number.format(totals.totalAcquisitions))
          .replace("{listings}", number.format(totals.totalListings));
  }

  return (
    <header>
      {known && <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(localeTag, { month: "long", year: "numeric" }).format(now)}</p>}
      {known ? (
        <h1 className="font-semibold mt-2 text-3xl tracking-tight sm:text-2xl">
          {greeting}
          {/* The name is often Latin inside a Persian sentence; isolate it
              so the bidi algorithm cannot carry the punctuation across. */}
          {name && <>{copy.greetingSeparator}<bdi>{name}</bdi></>}
          {copy.greetingEnd}
        </h1>
      ) : (
        <Skeleton className="mt-2 h-9 w-72 max-w-full sm:h-10" />
      )}
      {summary ? (
        <p className="mt-2 leading-6 text-muted-foreground">{summary}</p>
      ) : (
        <Skeleton className="mt-2 h-6 w-96 max-w-full" />
      )}
    </header>
  );
}

function OverviewStats({ state }: { state: OverviewState }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;

  if (state.status === "loading") {
    return (
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((index) => <StatTileSkeleton key={index} />)}
      </div>
    );
  }

  const localeTag = intlLocale(locale);
  const number = new Intl.NumberFormat(localeTag);
  const rating = new Intl.NumberFormat(localeTag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const totals = state.status === "ready" && state.home.kind === "creator" ? state.home.dashboard.summary : null;
  const show = (value: number | null | undefined) =>
    totals && value !== undefined && value !== null ? number.format(value) : "—";

  return (
    <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatTile
        label={copy.statAcquisitions7d}
        value={show(totals?.acquisitionsLast7Days)}
        delta={
          // Both finite, or no badge: an API a deploy behind lacks the fields.
          totals && Number.isFinite(totals.acquisitionsLast7Days) && Number.isFinite(totals.acquisitionsPrevious7Days)
            ? acquisitionDelta(totals.acquisitionsLast7Days - totals.acquisitionsPrevious7Days, number, copy)
            : undefined
        }
      />
      <StatTile label={copy.statLive} value={show(totals?.publishedListings)} />
      <StatTile
        label={copy.statRating}
        value={totals?.averageRating != null ? rating.format(totals.averageRating) : "—"}
        context={totals ? copy.ratingContext.replace("{n}", number.format(totals.ratedReviewCount)) : undefined}
      />
      <StatTile label={copy.statReview} value={show(totals?.inReviewListings)} />
    </dl>
  );
}

function acquisitionDelta(
  change: number,
  number: Intl.NumberFormat,
  copy: { deltaUp: string; deltaDown: string; deltaFlat: string },
): StatDelta {
  const display = number.format(Math.abs(change));
  const template = change > 0 ? copy.deltaUp : change < 0 ? copy.deltaDown : copy.deltaFlat;
  return { value: change, display, description: template.replace("{n}", display) };
}
