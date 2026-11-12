"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { listSupportTickets, type SupportList } from "@/lib/support-api";
import { supportCopy } from "./support-copy";
import { supportFailure, supportField, SupportError, SupportLoading, SupportSwitch, TicketStatus, TicketTime, useSupportAccess } from "./support-ui";

export function TicketList({ inbox = false }: { inbox?: boolean }) {
  const { locale } = useLocale(); const copy = supportCopy[locale];
  const staff = useSupportAccess();
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const query = params.toString();
  const [data, setData] = useState<SupportList | null>(null);
  const [failure, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null); const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([inbox, query, retry, staff, locale]);
  const forbidden = inbox && !staff;
  const error = forbidden ? copy.access : failure;
  const loading = !forbidden && completed !== requestKey;
  const page = Number(params.get("page") ?? 1);
  const base = `/dashboard/tickets${inbox ? "/inbox" : ""}`;
  useEffect(() => {
    const controller = new AbortController();
    if (forbidden) return;
    void listSupportTickets(inbox, query, controller.signal).then(next => { if (!controller.signal.aborted) { setData(next); setError(null); } })
      .catch(cause => { if (!controller.signal.aborted) { setData(null); setError(supportFailure(cause, copy)); } })
      .finally(() => { if (!controller.signal.aborted) setCompleted(requestKey); });
    return () => controller.abort();
  }, [inbox, query, requestKey, forbidden, copy]);
  function url(change: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(change)) { if (value) next.set(key, value); else next.delete(key); }
    return `${pathname}${next.size ? `?${next}` : ""}`;
  }
  const filtered = Boolean(params.get("q") || params.get("category") || params.get("status") || page > 1);
  return <section aria-labelledby="tickets-heading" className="mx-auto max-w-5xl">
    <SupportSwitch inbox={inbox} />
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><h1 id="tickets-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{inbox ? copy.inbox : copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{inbox ? copy.inboxSubtitle : copy.subtitle}</p></div>
      {!inbox && <Link href={localePath("/dashboard/tickets/new", locale)} className={buttonVariants()}>{copy.new}</Link>}
    </header>
    <form key={query} className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={event => {
      event.preventDefault(); const fields = new FormData(event.currentTarget);
      router.push(url({ q: String(fields.get("q") ?? "").trim(), category: String(fields.get("category") ?? ""), page: "" }));
    }}>
      <label className="space-y-2 text-sm font-medium">{copy.search}<input name="q" type="search" maxLength={120} defaultValue={params.get("q") ?? ""} placeholder={copy.searchHint} className={supportField} /></label>
      <label className="space-y-2 text-sm font-medium">{copy.category}<select name="category" defaultValue={params.get("category") ?? ""} className={supportField}>
        <option value="">{copy.allCategories}</option>{Object.entries(copy.categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label><Button variant="secondary" type="submit" className="self-end">{copy.apply}</Button>
    </form>
    <nav aria-label={copy.title} className="mb-6 flex flex-wrap gap-2">
      {(["all", "WAITING_FOR_SUPPORT", "WAITING_FOR_MEMBER", "RESOLVED"] as const).map(status => {
        const selected = (params.get("status") || "all") === status;
        return <Link key={status} href={url({ status: status === "all" ? "" : status, page: "" })} aria-current={selected ? "page" : undefined}
          className={`${buttonVariants({ variant: selected ? "secondary" : "ghost" })} text-xs`}>
          {status === "all" ? copy.all : status === "WAITING_FOR_MEMBER" && inbox ? copy.staffWaiting : copy.statuses[status]}
          {!loading && !error && data && <span className="tabular-nums text-muted-foreground">{data.counts[status].toLocaleString(locale)}</span>}
        </Link>;
      })}
    </nav>
    {loading ? <SupportLoading /> : error ? <SupportError message={error} retry={() => setRetry(value => value + 1)} /> : data && <>
      {!data.tickets.length ? <div className="rounded-card border-[length:0.0625rem] border-border bg-surface px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">{filtered ? copy.noMatches : copy.empty}</h2><p className="mt-2 text-sm text-muted-foreground">{filtered ? copy.noMatchesBody : copy.emptyBody}</p>
        {filtered && <Link className={`${buttonVariants({ variant: "ghost" })} mt-4`} href={localePath(base, locale)}>{copy.clear}</Link>}
      </div> : <ul className="space-y-3">{data.tickets.map(ticket => <li key={ticket.id}>
        <Link href={localePath(`${base}/${ticket.id}`, locale)} className="block rounded-card border-[length:0.0625rem] border-border bg-surface p-5 transition-colors duration-(--duration-hover) hover:border-border-strong hover:bg-surface-raised">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1 basis-64"><h2 className="line-clamp-2 break-words text-base font-semibold [overflow-wrap:anywhere]" dir="auto">{ticket.subject}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]" dir="auto">{ticket.preview}</p></div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:block sm:space-y-2 sm:text-end"><TicketStatus status={ticket.status} inbox={inbox} />
              <p className="text-xs text-muted-foreground"><span className="sr-only">{copy.activity}: </span><TicketTime value={ticket.updatedAt} /></p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="font-mono" dir="ltr">#{ticket.id}</span><span>{copy.categories[ticket.category]}</span>
            {inbox && <span>{copy.requester}: <bdi>{ticket.requester === "Member" ? copy.member : ticket.requester}</bdi></span>}
          </div>
        </Link>
      </li>)}</ul>}
      <nav aria-label={copy.page} className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {page > 1 ? <Link href={url({ page: String(page - 1) })} className={buttonVariants({ variant: "secondary" })}>{copy.previous}</Link> : <span />}
        <span className="text-sm tabular-nums text-muted-foreground">{copy.page} {data.page.toLocaleString(locale)} / {Math.max(1, Math.ceil(data.total / data.pageSize)).toLocaleString(locale)}</span>
        {page * data.pageSize < data.total ? <Link href={url({ page: String(page + 1) })} className={buttonVariants({ variant: "secondary" })}>{copy.next}</Link> : <span />}
      </nav>
    </>}
  </section>;
}
