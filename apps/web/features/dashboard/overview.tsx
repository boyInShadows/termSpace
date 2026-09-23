"use client";
import { useCallback, useEffect, useState } from "react";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { getDashboardHome, greetingPeriod } from "@/lib/dashboard";
import { useLocale } from "@/lib/locale-context";
import { ActivityFeed } from "./activity-feed";
import { Skeleton } from "./dashboard-card";
import { ListingsTable } from "./listings-table";
import type { OverviewState } from "./overview-state";
import { QuickActions } from "./quick-actions";
import { StatTile, StatTileSkeleton } from "./stat-tile";

/** Fetches the overview once, and again on Retry. */
export function DashboardOverview() {
  const session = useMarketplaceSession();
  const [state, setState] = useState<OverviewState>({ status: "loading" });
  const [reload, setReload] = useState(0);
  // Read once per mount; relative times and the greeting do not need to tick.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    getDashboardHome(controller.signal)
      .then((home) => setState({ status: "ready", home }))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Dashboard overview failed to load", cause);
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

  return <OverviewLayout state={state} now={now} name={name} onRetry={retry} />;
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
  return (
    <div className="space-y-8" aria-busy={state.status === "loading"}>
      {state.status === "loading" && <LoadingStatus />}
      <OverviewHeader state={state} now={now} name={name} />
      <OverviewStats state={state} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ListingsTable state={state} now={now} onRetry={onRetry} />
        <div className="space-y-6">
          <ActivityFeed state={state} now={now} onRetry={onRetry} />
          <QuickActions />
        </div>
      </div>
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
  const localeTag = locale === "fa" ? "fa-IR" : "en-US";
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
          .replace("{review}", number.format(totals.inReviewListings))
          .replace("{acquisitions}", number.format(totals.totalAcquisitions))
          .replace("{listings}", number.format(totals.totalListings));
  }

  return (
    <header>
      <p className="eyebrow flex items-center gap-2 text-muted-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
        {copy.eyebrow}
        {known && (
          <>
            {/* A drawn dot, not "·": in Persian digits that glyph reads as a zero. */}
            <span aria-hidden className="size-0.5 rounded-full bg-muted-foreground" />
            {new Intl.DateTimeFormat(localeTag, { month: "long", year: "numeric" }).format(now)}
          </>
        )}
      </p>
      {known ? (
        <h1 className="editorial mt-2 text-3xl tracking-tight sm:text-4xl">
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

  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const totals = state.status === "ready" && state.home.kind === "creator" ? state.home.dashboard.summary : null;
  const show = (value: number | undefined) => (totals && value !== undefined ? number.format(value) : "—");

  return (
    <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatTile label={copy.statAcquisitions} value={show(totals?.totalAcquisitions)} />
      <StatTile label={copy.statLive} value={show(totals?.publishedListings)} />
      <StatTile label={copy.statReview} value={show(totals?.inReviewListings)} />
      <StatTile label={copy.statTotal} value={show(totals?.totalListings)} />
    </dl>
  );
}
