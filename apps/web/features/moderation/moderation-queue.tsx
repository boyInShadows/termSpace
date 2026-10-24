"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getModerationQueue } from "./moderation-api";
import type { MarketplaceModerationQueueResult } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { useModerationCopy } from "./copy";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/format";
import { capabilityLabel, needsCloserLook } from "./capabilities";
import { CloserLook, listingStateLabel, StateMark } from "./moderation-ui";

const PAGE_SIZE = 24;
const STATES = ["draft", "submitted", "changes_requested", "approved", "published", "rejected", "suspended", "archived"] as const;

/** The queue's filters live in the URL, so reload, back and a shared link keep them. */
export function ModerationQueue() {
  const { locale, t } = useLocale();
  const m = useModerationCopy();
  const session = useMarketplaceSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Filters live in the URL, so a shared or mistyped link can carry a state the
  // API does not know; those fall back to the default rather than failing.
  const requestedState = params.get("state") ?? "review";
  const state = requestedState === "review" || requestedState === "all" || (STATES as readonly string[]).includes(requestedState) ? requestedState : "review";
  const query = params.get("q") ?? "";
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  // The field follows the URL (back, a shared link) until the moderator types again.
  const [typed, setTyped] = useState({ forQuery: query, value: query });
  const search = typed.forQuery === query ? typed.value : query;
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<MarketplaceModerationQueueResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canModerate = session.marketplaceRoles.includes("moderator") || session.marketplaceRoles.includes("administrator");
  const queueQuery = params.toString();

  const update = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key); else next.set(key, value);
    }
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (session.loading || !canModerate) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getModerationQueue({ state, q: query, page, limit: PAGE_SIZE }, controller.signal)
        .then((value) => { setResult(value); setError(null); })
        .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof ApiError ? cause.message : m.loadError); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canModerate, m.loadError, page, query, reload, session.loading, state]);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    update({ q: search.trim(), page: null });
  }

  if (session.loading) return <StatusLine message={m.loading} />;
  if (!canModerate) return <StatusLine message={m.accessDenied} error />;
  if (loading && !result) return <StatusLine message={m.loading} />;
  if (error && !result) return <StatusLine message={error} error action={<Button variant="secondary" onClick={() => setReload((value) => value + 1)}><RotateCcw className="size-4" />{m.retry}</Button>} />;
  if (!result) return null;

  const number = new Intl.NumberFormat(intlLocale(locale));
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const types = t.productCard.types as Record<string, string>;

  return <section aria-labelledby="moderation-queue-title" aria-busy={loading}>
    <h1 id="moderation-queue-title" className="text-2xl font-semibold sm:text-3xl">{m.queueTitle}</h1>
    <p className="mt-3 max-w-prose text-muted-foreground">{m.queueIntro}</p>

    <dl className="mt-6 grid grid-cols-3 divide-x divide-foreground/60 border border-foreground/60 rtl:divide-x-reverse">
      <Summary label={m.submitted} value={number.format(result.data.summary.submitted)} icon={<Clock3 />} />
      <Summary label={m.approved} value={number.format(result.data.summary.approved)} icon={<CheckCircle2 />} />
      <Summary label={m.awaitingAction} hint={m.awaitingActionHint} value={number.format(result.data.summary.awaitingAction)} icon={<ShieldAlert />} />
    </dl>

    <form className="mt-6 grid gap-4 border border-foreground/60 p-4 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={applySearch} role="search">
      <label className="text-sm font-semibold">{m.search}<span className="mt-2 flex items-center border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/20"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><Input className="border-0 bg-transparent shadow-none focus-visible:ring-0" value={search} onChange={(event) => setTyped({ forQuery: query, value: event.target.value })} placeholder={m.searchPlaceholder} /></span></label>
      <label className="text-sm font-semibold">{m.filter}<select className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm" value={state} onChange={(event) => update({ state: event.target.value === "review" ? null : event.target.value, page: null })}>
        <option value="review">{m.filterReview}</option><option value="all">{m.filterAll}</option>
        {STATES.map((value) => <option key={value} value={value}>{listingStateLabel(value, t.creatorHub)}</option>)}
      </select></label>
      <Button disabled={loading}>{m.searchButton}</Button>
    </form>

    {error && <div className="mt-4 flex items-center justify-between gap-3 border border-destructive/50 p-4"><p className="text-sm text-destructive" role="alert">{error}</p><Button size="sm" variant="secondary" onClick={() => setReload((value) => value + 1)}>{m.retry}</Button></div>}

    <p className="mt-6 text-xs text-muted-foreground">{number.format(result.meta.total)} · {m.orderNote}</p>
    {result.data.listings.length === 0 ? <div className="mt-2 border-y border-dashed py-10 text-center text-sm text-muted-foreground">{m.empty}</div> : <ul className="mt-2 divide-y divide-border border-y border-foreground/60">
      {result.data.listings.map((listing) => {
        const flagged = listing.capabilities.some((entry) => needsCloserLook(entry.capability));
        return <li key={listing.id} className="group relative p-4 hover:bg-surface sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-base font-semibold">
              <Link
                className="after:absolute after:inset-0 hover:underline focus-visible:underline"
                href={`${localePath(`/dashboard/moderation/listings/${listing.id}`, locale)}${queueQuery ? `?from=${encodeURIComponent(queueQuery)}` : ""}`}
              ><bdi>{listing.name}</bdi></Link>
            </h2>
            <StateMark state={listing.state} label={listingStateLabel(listing.state, t.creatorHub)} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground"><bdi>@{listing.creator.handle}</bdi> · {types[listing.type] ?? listing.type} · {date.format(new Date(listing.updatedAt))}</p>
          {listing.selfOwned && <p className="mt-2 flex items-center gap-2 text-sm"><ShieldAlert className="size-4 text-warning" aria-hidden />{m.selfOwned}</p>}

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            {listing.capabilities.length === 0
              ? <span className="text-muted-foreground">{m.noPermissions}</span>
              : listing.capabilities.map((entry) => <span key={entry.capability} className={cn("border px-1.5 py-0.5", needsCloserLook(entry.capability) ? "border-warning/60 font-semibold" : "border-border text-muted-foreground")}>{capabilityLabel(locale, entry.capability)}</span>)}
            {flagged && <CloserLook label={m.riskFlag} />}
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-5">
            <Fact label={m.revision} value={listing.proposedRevision === null ? "—" : number.format(listing.proposedRevision)} />
            <Fact label={m.release} value={listing.releaseVersion ?? "—"} mono />
            <Fact label={m.communities} value={number.format(listing.communityRequestCount)} />
            <Fact label={m.sourceResolved} value={listing.sourceResolved ? m.sourceOk : m.checkPending} pending={!listing.sourceResolved} />
            <Fact label={m.ownershipVerified} value={listing.ownershipVerified ? m.ownerOk : m.checkPending} pending={!listing.ownershipVerified} />
          </dl>
        </li>;
      })}
    </ul>}

    {result.meta.totalPages > 1 && <nav className="mt-6 flex items-center justify-between gap-2" aria-label={m.queuePages}>
      <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => update({ page: page - 1 <= 1 ? null : String(page - 1) })}>{m.previousPage}</Button>
      <span className="text-center text-xs text-muted-foreground">{m.pageStatus.replace("{page}", number.format(page)).replace("{pages}", number.format(result.meta.totalPages))}</span>
      <Button variant="secondary" size="sm" disabled={page >= result.meta.totalPages || loading} onClick={() => update({ page: String(page + 1) })}>{m.nextPage}</Button>
    </nav>}
  </section>;
}

function Summary({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: React.ReactNode }) {
  return <div className="min-w-0 p-3 sm:p-4"><dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm"><span className="hidden [&>svg]:size-4 sm:inline-flex" aria-hidden>{icon}</span>{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums sm:mt-2 sm:text-3xl">{value}</dd>{hint && <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{hint}</p>}</div>;
}

function Fact({ label, value, mono, pending }: { label: string; value: string; mono?: boolean; pending?: boolean }) {
  return <div className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className={cn("mt-0.5 break-words font-medium", mono && "font-mono", pending && "inline-flex items-center gap-1 border border-warning/60 px-1.5")}>{mono ? <bdi>{value}</bdi> : value}</dd></div>;
}

function StatusLine({ message, error, action }: { message: string; error?: boolean; action?: React.ReactNode }) {
  return <div className="border-y py-6"><p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
