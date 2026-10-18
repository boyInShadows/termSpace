"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, ExternalLink, Layers3, Package, Pencil, Plus, RotateCcw, Star } from "lucide-react";
import { ApiError, getCreatorDashboard } from "@/lib/api";
import { transitionCreatorListing, type CreatorListingAction } from "./creator-api";
import type { CreatorDashboardResult, CreatorDashboardListing } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/format";
import { creatorWorkspace } from "./workspace-copy";
import { listingStatusClass } from "@/lib/dashboard";

const PAGE_SIZE = 12;
type SubmissionFeedback = { id: string; message: string; sourceRequired?: boolean; refreshRequired?: boolean; success?: boolean } | null;

export function CreatorDashboard({ onReady }: { onReady?: () => void } = {}) {
  const { locale, t } = useLocale();
  const hub = { ...t.creatorHub, ...creatorWorkspace[locale].creatorHub };
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CreatorDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback>(null);
  const [reviewing, setReviewing] = useState<{ id: string; action: CreatorListingAction } | null>(null);
  const mutationPending = useRef(false);

  useEffect(() => { if (!loading) onReady?.(); }, [loading, onReady]);

  useEffect(() => {
    const controller = new AbortController();
    void getCreatorDashboard(page, PAGE_SIZE, controller.signal)
      .then((value) => {
        setResult(value);
        setError(false);
        setSubmissionFeedback((feedback) => feedback?.refreshRequired ? null : feedback);
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

  async function transitionListing(listing: CreatorDashboardListing, action: CreatorListingAction) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSubmittingId(listing.id);
    setSubmissionFeedback(null);
    try {
      const transition = await transitionCreatorListing(listing.id, listing.lifecycleVersion, action);
      setResult((current) => current ? { ...current, data: { ...current.data, listings: current.data.listings.map((item) => item.id === listing.id ? { ...item, state: transition.state.toLowerCase(), lifecycleVersion: transition.version, published: transition.published, restoreTarget: null } : item) } } : current);
      const message = { SUBMIT: hub.statusSubmitted, WITHDRAW: hub.withdrawalSuccess, ARCHIVE: hub.archiveSuccess, RESTORE: hub.restoreSuccess }[action];
      setSubmissionFeedback({ id: listing.id, message, success: true });
      setReviewing(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : "";
      const refreshRequired = code === "LISTING_VERSION_CONFLICT" || code === "INVALID_LISTING_TRANSITION";
      const archiveAction = action === "ARCHIVE" || action === "RESTORE";
      const message = refreshRequired
        ? archiveAction ? hub.archiveConflict : action === "WITHDRAW" ? hub.withdrawalConflict : t.creatorDraft.versionConflict
        : code === "SOURCE_VERIFICATION_REQUIRED"
          ? action === "RESTORE" ? hub.restoreSourceRequired : hub.submissionSourceRequired
          : archiveAction ? hub.archiveError : action === "WITHDRAW" ? hub.withdrawalError : hub.submissionError;
      setSubmissionFeedback({ id: listing.id, message, sourceRequired: code === "SOURCE_VERIFICATION_REQUIRED", refreshRequired });
    } finally {
      mutationPending.current = false;
      setSubmittingId(null);
    }
  }

  if (loading && !result) {
    return <section className="rounded-none border bg-surface p-8" aria-busy="true">
      <p className="text-sm text-muted-foreground" role="status">{hub.dashboardLoading}</p>
    </section>;
  }

  if (error && !result) {
    return <section className="rounded-none border border-destructive/30 bg-surface p-8">
      <p className="text-sm text-destructive" role="alert">{hub.dashboardLoadError}</p>
      <Button className="mt-5" variant="secondary" onClick={retry}>
        <RotateCcw aria-hidden="true" className="size-4" />{hub.retry}
      </Button>
    </section>;
  }

  if (!result) return null;
  const number = new Intl.NumberFormat(intlLocale(locale));
  const { summary, listings } = result.data;

  return <section aria-labelledby="creator-dashboard-title">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h1 id="creator-dashboard-title" className="font-semibold mt-2 text-2xl sm:text-3xl">{hub.dashboardTitle}</h1>
        <p className="mt-3 text-muted-foreground">{hub.dashboardIntro}</p>
      </div>
      <Link className={`${buttonVariants()} shrink-0 whitespace-nowrap`} href={localePath("/dashboard/studio/listings/new", locale)}>
        <Plus aria-hidden="true" className="size-4" />{hub.newListing}
      </Link>
    </div>

    <dl className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <SummaryCard label={hub.totalListings} value={number.format(summary.totalListings)} icon={<Package />} />
      <SummaryCard label={hub.publishedListings} value={number.format(summary.publishedListings)} icon={<Layers3 />} />
      <SummaryCard label={hub.inReviewListings} value={number.format(summary.inReviewListings)} icon={<RotateCcw />} />
      <SummaryCard label={hub.totalAcquisitions} value={number.format(summary.totalAcquisitions)} icon={<Download />} />
    </dl>

    <div className="mt-6 flex items-end justify-between gap-5 border-b pb-4">
      <div>
        <h2 className="font-semibold text-3xl">{hub.yourListings}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hub.listingsIntro}</p>
      </div>
      {loading && <span className="text-xs text-muted-foreground" role="status">{hub.dashboardLoading}</span>}
    </div>

    {error && result && <div className="mt-4 flex items-center justify-between gap-4 rounded-none border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm text-destructive" role="alert">{hub.dashboardLoadError}</p>
      <Button size="sm" variant="secondary" onClick={retry}>{hub.retry}</Button>
    </div>}

    {listings.length === 0 ? <div className="mt-5 rounded-none border border-dashed bg-muted/25 p-10 text-center">
      <h3 className="font-semibold text-2xl">{hub.noListings}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{hub.noListingsIntro}</p>
    </div> : <div className="mt-5 space-y-4">
      {listings.map((listing) => <ListingCard
        key={listing.id}
        listing={listing}
        submitting={submittingId !== null || loading}
        feedback={submissionFeedback?.id === listing.id ? submissionFeedback : null}
        action={reviewing?.id === listing.id ? reviewing.action : null}
        onReview={(action) => { setReviewing({ id: listing.id, action }); setSubmissionFeedback((feedback) => feedback?.id === listing.id && feedback.refreshRequired ? feedback : null); }}
        onCancel={() => setReviewing(null)}
        onRefresh={retry}
        onTransition={transitionListing}
      />)}
    </div>}

    {result.meta.totalPages > 1 && <nav className="mt-6 flex items-center justify-between" aria-label={hub.paginationLabel}>
      <Button variant="secondary" disabled={page <= 1 || loading || submittingId !== null} onClick={() => changePage(Math.max(1, page - 1))}>
        {locale === "fa" ? <ArrowRight aria-hidden="true" className="size-4" /> : <ArrowLeft aria-hidden="true" className="size-4" />}
        {hub.previousPage}
      </Button>
      <span className="text-sm text-muted-foreground">{hub.pageStatus.replace("{page}", number.format(page)).replace("{pages}", number.format(result.meta.totalPages))}</span>
      <Button variant="secondary" disabled={page >= result.meta.totalPages || loading || submittingId !== null} onClick={() => changePage(page + 1)}>
        {hub.nextPage}
        {locale === "fa" ? <ArrowLeft aria-hidden="true" className="size-4" /> : <ArrowRight aria-hidden="true" className="size-4" />}
      </Button>
    </nav>}
  </section>;
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactElement }) {
  return <div className="rounded-none border bg-surface p-5">
    <dt className="flex min-h-10 items-start gap-2 text-xs font-medium leading-5 text-muted-foreground">
      <span className="text-primary [&>svg]:size-4" aria-hidden="true">{icon}</span>{label}
    </dt>
    <dd className="mt-3 break-all text-3xl font-semibold tabular-nums">{value}</dd>
  </div>;
}

function ListingCard({ listing, submitting, feedback, action, onReview, onCancel, onRefresh, onTransition }: {
  listing: CreatorDashboardListing;
  submitting: boolean;
  feedback: SubmissionFeedback;
  action: CreatorListingAction | null;
  onReview: (action: CreatorListingAction) => void;
  onCancel: () => void;
  onRefresh: () => void;
  onTransition: (listing: CreatorDashboardListing, action: CreatorListingAction) => void;
}) {
  const { locale, t } = useLocale();
  const hub = { ...t.creatorHub, ...creatorWorkspace[locale].creatorHub };
  const number = new Intl.NumberFormat(intlLocale(locale));
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const stateLabel = listingStateLabel(listing.state, hub);
  const withdrawable = listing.state === "submitted";
  const archivable = ["draft", "submitted", "changes_requested", "approved", "published", "rejected"].includes(listing.state);
  const restorable = listing.state === "archived" && Boolean(listing.restoreTarget);
  const actionCopy = {
    SUBMIT: { title: hub.reviewSubmission, help: hub.submissionHelp, confirm: hub.actionSubmitted, cancel: hub.cancelSubmission },
    WITHDRAW: { title: hub.withdrawReview, help: hub.withdrawalHelp, confirm: hub.confirmWithdrawal, cancel: hub.keepInReview },
    ARCHIVE: { title: hub.archiveListing, help: hub.archiveHelp, confirm: hub.confirmArchive, cancel: hub.cancelArchive },
    RESTORE: { title: hub.restoreListing, help: hub.restoreHelp.replace("{state}", listingStateLabel(listing.restoreTarget?.state ?? "", hub)) + " " + (listing.restoreTarget?.published ? hub.restorePublicHelp : hub.restorePrivateHelp), confirm: hub.confirmRestore, cancel: hub.cancelRestore },
  };
  const canConfirm = action === "SUBMIT" ? isEditable(listing.state) && listing.state !== "published"
    : action === "WITHDRAW" ? withdrawable : action === "ARCHIVE" ? archivable : action === "RESTORE" && restorable;
  const confirmation = action && canConfirm ? actionCopy[action] : null;
  const secondaryActions = (["WITHDRAW", "ARCHIVE", "RESTORE"] as const).filter((item) => item === "WITHDRAW" ? withdrawable : item === "ARCHIVE" ? archivable : restorable);
  const trigger = useRef<HTMLButtonElement | null>(null);

  function cancel() {
    onCancel();
    trigger.current?.focus();
  }

  return <article className="rounded-none border bg-surface p-5 sm:p-6 [&_button]:scroll-mt-32 [&_button]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="break-words text-lg font-semibold"><bdi>{listing.name}</bdi></h3>
          <span className={cn("px-2.5 py-1 text-xs font-semibold", listingStatusClass(listing.state))}>{stateLabel}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{listing.type} · {hub.version} {listing.currentVersion}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isEditable(listing.state) && <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/dashboard/studio/listings/${listing.id}/edit`, locale)}>
          <Pencil aria-hidden="true" className="size-4" />{hub.editDraft}
        </Link>}
        <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/dashboard/studio/listings/${listing.id}/releases`, locale)}>
          <Layers3 aria-hidden="true" className="size-4" />{hub.manageReleases}
        </Link>
        {isEditable(listing.state) && listing.state !== "published" && !action && <Button size="sm" disabled={submitting} onClick={() => onReview("SUBMIT")}>
          {hub.reviewSubmission}
        </Button>}
        {secondaryActions.map((item) => <Button key={item} size="sm" variant="secondary" disabled={submitting} aria-expanded={action === item && canConfirm} aria-controls={`listing-review-${listing.id}`} onClick={(event) => { trigger.current = event.currentTarget; if (action === item) cancel(); else onReview(item); }}>{actionCopy[item].title}</Button>)}
        {listing.published && <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/products/${listing.slug}`, locale)}>
          {hub.viewPublic}<ExternalLink aria-hidden="true" className="size-4" />
        </Link>}
      </div>
    </div>

    {confirmation && action && <section id={`listing-review-${listing.id}`} className="mt-4 space-y-3 border-y py-4" aria-label={confirmation.title}>
      <h4 className="font-semibold">{confirmation.title}: <bdi>{listing.name}</bdi></h4>
      <p className="max-w-prose text-sm text-muted-foreground">{confirmation.help}</p>
      <div className="flex flex-wrap gap-3"><Button disabled={submitting || feedback?.refreshRequired} onClick={() => onTransition(listing, action)}>{submitting ? hub.dashboardLoading : confirmation.confirm}</Button><Button variant="secondary" disabled={submitting} onClick={cancel}>{confirmation.cancel}</Button></div>
    </section>}

    {listing.state === "archived" && !restorable && !submitting && <div className="mt-4 max-w-prose text-sm text-muted-foreground"><p>{hub.restoreUnavailable}</p><Button className="mt-2" size="sm" variant="secondary" onClick={onRefresh}>{hub.retry}</Button></div>}

    {feedback && <div className={cn("mt-4 text-sm", feedback.success ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")} role={feedback.success ? "status" : "alert"}>
      <span>{feedback.message}</span>
      {feedback.sourceRequired && <Link className="ms-2 font-semibold underline underline-offset-4" href={localePath(`/dashboard/studio/listings/${listing.id}/releases`, locale)}>{hub.manageReleases}</Link>}
      {!feedback.success && <Button className="ms-2" size="sm" variant="secondary" disabled={submitting} onClick={onRefresh}>{hub.retry}</Button>}
    </div>}

    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y py-4 sm:grid-cols-4">
      <Metric label={hub.rating} value={listing.reviewCount ? `${number.format(listing.rating)} / ${number.format(5)}` : hub.noRating} icon={<Star />} />
      <Metric label={hub.reviews} value={number.format(listing.reviewCount)} />
      <Metric label={hub.acquisitions} value={number.format(listing.acquisitionCount)} icon={<Download />} />
      <Metric label={hub.releases} value={number.format(listing.releaseCount)} icon={<Layers3 />} />
    </dl>

    {listing.moderationFeedback?.message && <div className="mt-5 rounded-none border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">{hub.moderationFeedback}</p>
      <p className="mt-2 text-sm">{listing.moderationFeedback.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">{date.format(new Date(listing.moderationFeedback.createdAt))} · {listing.moderationFeedback.reasonCode.replaceAll("_", " ")}</p>
    </div>}

    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{hub.recentUpdates}</h4>
        {listing.recentUpdates.length ? <ol className="mt-2 space-y-2">
          {listing.recentUpdates.map((event) => <li key={event.id} className="flex items-start justify-between gap-4 text-sm">
            <span>{lifecycleActionLabel(event.action, hub)}</span>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time>
          </li>)}
        </ol> : <p className="mt-2 text-sm text-muted-foreground">{hub.noRecentUpdates}</p>}
      </div>
      <p className="text-xs text-muted-foreground lg:text-end">{hub.updated} {date.format(new Date(listing.updatedAt))}</p>
    </div>
  </article>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactElement }) {
  return <div>
    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon && <span aria-hidden="true" className="[&>svg]:size-3.5">{icon}</span>}{label}</dt>
    <dd className="mt-1 font-semibold tabular-nums"><bdi dir="ltr">{value}</bdi></dd>
  </div>;
}

export function isEditable(state: string) {
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
