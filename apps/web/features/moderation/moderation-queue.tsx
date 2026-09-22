"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { getModerationQueue } from "@/lib/api";
import type { MarketplaceModerationQueueResult } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

export function ModerationQueue() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const [state, setState] = useState("review");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<MarketplaceModerationQueueResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canModerate = session.marketplaceRoles.includes("moderator") || session.marketplaceRoles.includes("administrator");

  useEffect(() => {
    if (session.loading || !canModerate) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getModerationQueue({ state, q: query, page, limit: PAGE_SIZE }, controller.signal)
        .then((value) => { setResult(value); setError(false); })
        .catch(() => { if (!controller.signal.aborted) setError(true); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canModerate, page, query, reload, session.loading, state]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  if (session.loading) return <StatusCard message={t.moderation.loading} />;
  if (!canModerate) return <StatusCard message={t.moderation.accessDenied} error />;
  if (loading && !result) return <StatusCard message={t.moderation.loading} />;
  if (error && !result) return <StatusCard message={t.moderation.loadError} error action={<Button variant="secondary" onClick={() => setReload((value) => value + 1)}><RotateCcw className="size-4" />{t.moderation.retry}</Button>} />;
  if (!result) return null;

  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" });

  return <section aria-labelledby="moderation-queue-title">
    <header className="max-w-3xl">
      <p className="eyebrow">{t.moderation.eyebrow}</p>
      <h1 id="moderation-queue-title" className="editorial mt-2 text-4xl sm:text-5xl">{t.moderation.queueTitle}</h1>
      <p className="mt-3 text-muted-foreground">{t.moderation.queueIntro}</p>
    </header>

    <dl className="mt-8 grid gap-3 sm:grid-cols-3">
      <Summary label={t.moderation.submitted} value={number.format(result.data.summary.submitted)} icon={<Clock3 />} />
      <Summary label={t.moderation.approved} value={number.format(result.data.summary.approved)} icon={<CheckCircle2 />} />
      <Summary label={t.moderation.awaitingAction} value={number.format(result.data.summary.awaitingAction)} icon={<ShieldAlert />} />
    </dl>

    <form className="mt-8 grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={applyFilters}>
      <label className="text-sm font-semibold">{t.moderation.search}<span className="mt-2 flex items-center rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/20"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><Input className="border-0 bg-transparent shadow-none focus-visible:ring-0" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.moderation.searchPlaceholder} /></span></label>
      <label className="text-sm font-semibold">{t.moderation.filter}<select className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}>
        <option value="review">{t.moderation.filterReview}</option><option value="all">{t.moderation.filterAll}</option>
        {stateOptions(t.creatorHub).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <Button disabled={loading}>{t.moderation.apply}</Button>
    </form>

    {error && <div className="mt-4 flex items-center justify-between rounded-xl border border-destructive/30 p-4"><p className="text-sm text-destructive" role="alert">{t.moderation.loadError}</p><Button size="sm" variant="secondary" onClick={() => setReload((value) => value + 1)}>{t.moderation.retry}</Button></div>}

    {result.data.listings.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t.moderation.empty}</div> : <div className="mt-5 space-y-4">
      {result.data.listings.map((listing) => <article key={listing.id} className="rounded-2xl border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{listing.name}</h2><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusClass(listing.state))}>{listingStateLabel(listing.state, t.creatorHub)}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">@{listing.creator.handle} · {listing.type} · {date.format(new Date(listing.updatedAt))}</p>
            {listing.selfOwned && <p className="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"><ShieldAlert className="size-4" />{t.moderation.selfOwned}</p>}
          </div>
          <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={localePath(`/moderation/listings/${listing.id}`, locale)}>{t.moderation.review}{locale === "fa" ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}</Link>
        </div>
        <dl className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <Fact label={t.moderation.revision} value={listing.proposedRevision === null ? "—" : number.format(listing.proposedRevision)} />
          <Fact label={t.moderation.release} value={listing.releaseVersion ?? "—"} />
          <Fact label={t.moderation.communities} value={number.format(listing.communityRequestCount)} />
          <Fact label={t.moderation.sourceResolved} value={listing.sourceResolved ? t.moderation.checkPassed : t.moderation.checkPending} good={listing.sourceResolved} />
          <Fact label={t.moderation.ownershipVerified} value={listing.ownershipVerified ? t.moderation.checkPassed : t.moderation.checkPending} good={listing.ownershipVerified} />
        </dl>
      </article>)}
    </div>}

    {result.meta.totalPages > 1 && <nav className="mt-6 flex items-center justify-between" aria-label={t.moderation.queueTitle}>
      <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>{locale === "fa" ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{t.moderation.previousPage}</Button>
      <span className="text-sm text-muted-foreground">{t.moderation.pageStatus.replace("{page}", number.format(page)).replace("{pages}", number.format(result.meta.totalPages))}</span>
      <Button variant="secondary" disabled={page >= result.meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>{t.moderation.nextPage}{locale === "fa" ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}</Button>
    </nav>}
  </section>;
}

function Summary({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border bg-surface p-5"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span className="text-primary [&>svg]:size-4">{icon}</span>{label}</dt><dd className="mt-3 text-3xl font-semibold tabular-nums">{value}</dd></div>; }
function Fact({ label, value, good }: { label: string; value: string; good?: boolean }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className={cn("mt-1 text-sm font-semibold", good === false && "text-amber-700 dark:text-amber-300", good === true && "text-emerald-700 dark:text-emerald-300")}>{value}</dd></div>; }
function StatusCard({ message, error, action }: { message: string; error?: boolean; action?: React.ReactNode }) { return <div className="rounded-2xl border bg-surface p-8"><p className={error ? "text-destructive" : "text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function stateOptions(copy: Record<string, string>): Array<[string, string]> { return [["draft", copy.statusDraft], ["submitted", copy.statusSubmitted], ["changes_requested", copy.statusChangesRequested], ["approved", copy.statusApproved], ["published", copy.statusPublished], ["rejected", copy.statusRejected], ["suspended", copy.statusSuspended], ["archived", copy.statusArchived]]; }
function listingStateLabel(state: string, copy: Record<string, string>) { return Object.fromEntries(stateOptions(copy))[state] ?? state.replaceAll("_", " "); }
function statusClass(state: string) { if (state === "submitted" || state === "approved") return "bg-blue-500/10 text-blue-700 dark:text-blue-300"; if (state === "published") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"; if (["changes_requested", "rejected", "suspended"].includes(state)) return "bg-amber-500/10 text-amber-800 dark:text-amber-300"; return "bg-muted text-muted-foreground"; }
