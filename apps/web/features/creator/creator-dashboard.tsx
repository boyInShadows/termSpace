"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, ExternalLink, Layers3, Package, Pencil, Plus, RotateCcw, Star } from "lucide-react";
import { getCreatorDashboard } from "@/lib/api";
import type { CreatorDashboardResult, CreatorDashboardListing } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export function CreatorDashboard() {
  const { locale, t } = useLocale();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CreatorDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getCreatorDashboard(page, PAGE_SIZE, controller.signal)
      .then((value) => {
        setResult(value);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, reload]);

  function retry() {
    setLoading(true);
    setError(false);
    setReload((value) => value + 1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError(false);
    setPage(nextPage);
  }

  if (loading && !result) {
    return <section className="rounded-2xl border bg-surface p-8" aria-busy="true">
      <p className="text-sm text-muted-foreground" role="status">{t.creatorHub.dashboardLoading}</p>
    </section>;
  }

  if (error && !result) {
    return <section className="rounded-2xl border border-destructive/30 bg-surface p-8">
      <p className="text-sm text-destructive" role="alert">{t.creatorHub.dashboardLoadError}</p>
      <Button className="mt-5" variant="secondary" onClick={retry}>
        <RotateCcw aria-hidden="true" className="size-4" />{t.creatorHub.retry}
      </Button>
    </section>;
  }

  if (!result) return null;
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const { summary, listings } = result.data;

  return <section aria-labelledby="creator-dashboard-title">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow">{t.creatorHub.dashboardEyebrow}</p>
        <h1 id="creator-dashboard-title" className="editorial mt-2 text-4xl sm:text-5xl">{t.creatorHub.dashboardTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.creatorHub.dashboardIntro}</p>
      </div>
      <Link className={buttonVariants()} href={localePath("/creator/listings/new", locale)}>
        <Plus aria-hidden="true" className="size-4" />{t.creatorHub.newListing}
      </Link>
    </div>

    <dl className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label={t.creatorHub.totalListings} value={number.format(summary.totalListings)} icon={<Package />} />
      <SummaryCard label={t.creatorHub.publishedListings} value={number.format(summary.publishedListings)} icon={<Layers3 />} />
      <SummaryCard label={t.creatorHub.inReviewListings} value={number.format(summary.inReviewListings)} icon={<RotateCcw />} />
      <SummaryCard label={t.creatorHub.totalAcquisitions} value={number.format(summary.totalAcquisitions)} icon={<Download />} />
    </dl>

    <div className="mt-10 flex items-end justify-between gap-5 border-b pb-4">
      <div>
        <h2 className="editorial text-3xl">{t.creatorHub.yourListings}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.creatorHub.listingsIntro}</p>
      </div>
      {loading && <span className="text-xs text-muted-foreground" role="status">{t.creatorHub.dashboardLoading}</span>}
    </div>

    {error && result && <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm text-destructive" role="alert">{t.creatorHub.dashboardLoadError}</p>
      <Button size="sm" variant="secondary" onClick={retry}>{t.creatorHub.retry}</Button>
    </div>}

    {listings.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed bg-muted/25 p-10 text-center">
      <h3 className="editorial text-2xl">{t.creatorHub.noListings}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t.creatorHub.noListingsIntro}</p>
    </div> : <div className="mt-5 space-y-4">
      {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
    </div>}

    {result.meta.totalPages > 1 && <nav className="mt-6 flex items-center justify-between" aria-label={t.creatorHub.paginationLabel}>
      <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => changePage(Math.max(1, page - 1))}>
        {locale === "fa" ? <ArrowRight aria-hidden="true" className="size-4" /> : <ArrowLeft aria-hidden="true" className="size-4" />}
        {t.creatorHub.previousPage}
      </Button>
      <span className="text-sm text-muted-foreground">{t.creatorHub.pageStatus.replace("{page}", number.format(page)).replace("{pages}", number.format(result.meta.totalPages))}</span>
      <Button variant="secondary" disabled={page >= result.meta.totalPages || loading} onClick={() => changePage(page + 1)}>
        {t.creatorHub.nextPage}
        {locale === "fa" ? <ArrowLeft aria-hidden="true" className="size-4" /> : <ArrowRight aria-hidden="true" className="size-4" />}
      </Button>
    </nav>}
  </section>;
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactElement }) {
  return <div className="rounded-xl border bg-surface p-5">
    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      <span className="text-primary [&>svg]:size-4" aria-hidden="true">{icon}</span>{label}
    </dt>
    <dd className="mt-3 text-3xl font-semibold tabular-nums">{value}</dd>
  </div>;
}

function ListingCard({ listing }: { listing: CreatorDashboardListing }) {
  const { locale, t } = useLocale();
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" });
  const stateLabel = listingStateLabel(listing.state, t.creatorHub);

  return <article className="rounded-2xl border bg-surface p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-semibold">{listing.name}</h3>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusClass(listing.state))}>{stateLabel}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{listing.type} · {t.creatorHub.version} {listing.currentVersion}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isEditable(listing.state) && <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/creator/listings/${listing.id}/edit`, locale)}>
          <Pencil aria-hidden="true" className="size-4" />{t.creatorHub.editDraft}
        </Link>}
        <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/creator/listings/${listing.id}/releases`, locale)}>
          <Layers3 aria-hidden="true" className="size-4" />{t.creatorHub.manageReleases}
        </Link>
        {listing.published && <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/products/${listing.slug}`, locale)}>
          {t.creatorHub.viewPublic}<ExternalLink aria-hidden="true" className="size-4" />
        </Link>}
      </div>
    </div>

    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y py-4 sm:grid-cols-4">
      <Metric label={t.creatorHub.rating} value={listing.reviewCount ? `${number.format(listing.rating)} / 5` : t.creatorHub.noRating} icon={<Star />} />
      <Metric label={t.creatorHub.reviews} value={number.format(listing.reviewCount)} />
      <Metric label={t.creatorHub.acquisitions} value={number.format(listing.acquisitionCount)} icon={<Download />} />
      <Metric label={t.creatorHub.releases} value={number.format(listing.releaseCount)} icon={<Layers3 />} />
    </dl>

    {listing.moderationFeedback?.message && <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">{t.creatorHub.moderationFeedback}</p>
      <p className="mt-2 text-sm">{listing.moderationFeedback.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">{date.format(new Date(listing.moderationFeedback.createdAt))} · {listing.moderationFeedback.reasonCode.replaceAll("_", " ")}</p>
    </div>}

    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.creatorHub.recentUpdates}</h4>
        {listing.recentUpdates.length ? <ol className="mt-2 space-y-2">
          {listing.recentUpdates.map((event) => <li key={event.id} className="flex items-start justify-between gap-4 text-sm">
            <span>{lifecycleActionLabel(event.action, t.creatorHub)}</span>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time>
          </li>)}
        </ol> : <p className="mt-2 text-sm text-muted-foreground">{t.creatorHub.noRecentUpdates}</p>}
      </div>
      <p className="text-xs text-muted-foreground lg:text-end">{t.creatorHub.updated} {date.format(new Date(listing.updatedAt))}</p>
    </div>
  </article>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactElement }) {
  return <div>
    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon && <span aria-hidden="true" className="[&>svg]:size-3.5">{icon}</span>}{label}</dt>
    <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
  </div>;
}

function statusClass(state: string) {
  if (state === "published") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (state === "submitted" || state === "approved") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (state === "changes_requested" || state === "suspended" || state === "rejected") return "bg-amber-500/10 text-amber-800 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

function isEditable(state: string) {
  return state === "draft" || state === "changes_requested" || state === "rejected" || state === "published";
}

export function listingStateLabel(state: string, copy: Record<string, string>) {
  const labels: Record<string, string> = {
    draft: copy.statusDraft, submitted: copy.statusSubmitted, changes_requested: copy.statusChangesRequested,
    approved: copy.statusApproved, published: copy.statusPublished, rejected: copy.statusRejected,
    suspended: copy.statusSuspended, archived: copy.statusArchived,
  };
  return labels[state] ?? state.replaceAll("_", " ");
}

export function lifecycleActionLabel(action: string, copy: Record<string, string>) {
  const labels: Record<string, string> = {
    draft_saved: copy.actionDraftSaved, submitted: copy.actionSubmitted, withdrawn: copy.actionWithdrawn,
    changes_requested: copy.actionChangesRequested, approved: copy.actionApproved, published: copy.actionPublished,
    rejected: copy.actionRejected, suspended: copy.actionSuspended, reinstated: copy.actionReinstated,
    archived: copy.actionArchived, restored: copy.actionRestored,
  };
  return labels[action] ?? action.replaceAll("_", " ");
}
