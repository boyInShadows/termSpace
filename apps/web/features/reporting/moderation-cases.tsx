"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { ApiError, getCaseEvents, getCaseReports, getReportCase, getReportCases, triageReportCase } from "@/lib/api";
import { intlLocale } from "@/lib/format";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { ModerationCaseEvent, ModerationCasePage, ModerationCaseReport, ModerationCaseState, ModerationCaseSummary, ModerationCaseTriage, ProductPageResult } from "@/lib/types";
import { reportingCopy, reportingError } from "./copy";

export function ReportCaseNavigation() {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const casesActive = usePathname()?.includes("/moderation/cases");
  return <nav aria-label={t.cases} className="mb-8 flex flex-wrap gap-3">
    <Link className={buttonVariants({ variant: casesActive ? "secondary" : "primary" })} aria-current={casesActive ? undefined : "page"} href={localePath("/moderation", locale)}>{t.listingQueue}</Link>
    <Link className={buttonVariants({ variant: casesActive ? "primary" : "secondary" })} aria-current={casesActive ? "page" : undefined} href={localePath("/moderation/cases", locale)}>{t.cases}</Link>
  </nav>;
}

function StaffCaseAccess({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const session = useMarketplaceSession();
  if (session.identityLoading) return <p role="status">{t.loading}</p>;
  if (!session.emailVerified || !session.marketplaceRoles.some((role) => role === "moderator" || role === "administrator")) return <p role="alert" className="text-destructive">{t.denied}</p>;
  return <div key={session.email}>{children}</div>;
}

export function ModerationCases({ state, page }: { state?: ModerationCaseState; page: number }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  return <><ReportCaseNavigation /><header className="mb-8 max-w-3xl"><h1 className="text-4xl font-semibold tracking-tight">{t.cases}</h1><p className="mt-3 text-muted-foreground">{t.casesIntro}</p></header>
    <StaffCaseAccess><CaseQueue key={`${state}:${page}`} state={state} page={page} /></StaffCaseAccess></>;
}

function CaseQueue({ state, page }: { state?: ModerationCaseState; page: number }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const [result, setResult] = useState<ModerationCasePage<ModerationCaseSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getReportCases(state, page, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setResult(value); setError(null); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(reportingError(cause, locale, "read")); });
    return () => controller.abort();
  }, [locale, page, reload, state]);
  const href = (next: number) => localePath(`/moderation/cases?${new URLSearchParams({ page: String(next), ...(state ? { state } : {}) })}`, locale);
  return <section aria-label={t.cases}>
    <form action={localePath("/moderation/cases", locale)} method="get" className="mb-6 flex flex-wrap items-end gap-3 border-y py-5">
      <label className="min-w-0 text-sm font-semibold">{t.filter}<select name="state" defaultValue={state ?? ""} className="mt-2 block min-h-11 w-full border border-input bg-background px-3 text-base font-normal">
        <option value="">{t.all}</option>{(Object.keys(t.states) as ModerationCaseState[]).map((value) => <option key={value} value={value}>{t.states[value]}</option>)}
      </select></label><Button type="submit">{t.apply}</Button>
    </form>
    {error ? <Recovery message={error} retry={() => setReload((value) => value + 1)} /> : !result ? <p role="status">{t.loading}</p> : <>
      {result.data.length === 0 ? <p className="border-b py-8 text-muted-foreground">{t.empty}</p> : <div className="divide-y border-y">
        {result.data.map((record) => <article key={record.id} className="grid min-w-0 gap-4 py-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0"><h2 className="ts-bidi break-words text-xl font-semibold">{record.product.name}</h2><p className="mt-2 text-sm text-muted-foreground">{t.reasons[record.reason]}</p><CaseFacts record={record} /></div>
          <Link className={buttonVariants({ variant: "secondary" })} href={localePath(`/moderation/cases/${record.id}`, locale)}>{t.openCase}</Link>
        </article>)}
      </div>}
      <CasePager meta={result.meta} href={href} label={t.cases} />
    </>}
  </section>;
}

function CaseFacts({ record }: { record: ModerationCaseSummary }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  return <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
    {[[t.state, t.states[record.state]], [t.severity, t.severities[record.severity]], [t.reportCount, new Intl.NumberFormat(intlLocale(locale)).format(record._count.reports)], [t.created, date.format(new Date(record.createdAt))]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
  </dl>;
}

type Detail = { record: ModerationCaseSummary; reports: ModerationCasePage<ModerationCaseReport>; events: ModerationCasePage<ModerationCaseEvent> };

export function ModerationCase({ id, reportsPage, eventsPage }: { id: string; reportsPage: number; eventsPage: number }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  return <><ReportCaseNavigation /><h1 className="mb-8 text-4xl font-semibold tracking-tight">{t.openCase}</h1><StaffCaseAccess><CaseDetail key={id} id={id} reportsPage={reportsPage} eventsPage={eventsPage} /></StaffCaseAccess></>;
}

function CaseDetail({ id, reportsPage, eventsPage }: { id: string; reportsPage: number; eventsPage: number }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void Promise.all([getReportCase(id, controller.signal), getCaseReports(id, reportsPage, controller.signal), getCaseEvents(id, eventsPage, controller.signal)]).then(([record, reports, events]) => {
        if (!controller.signal.aborted) { setDetail({ record, reports, events }); setError(null); }
      }).catch((cause) => {
        if (!controller.signal.aborted) {
          if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setDetail(null);
          setError(reportingError(cause, locale, "read"));
        }
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [eventsPage, id, locale, reload, reportsPage]);
  const retry = () => { setLoading(true); setReload((value) => value + 1); };
  const href = (kind: "reportsPage" | "eventsPage", page: number) => localePath(`/moderation/cases/${id}?${new URLSearchParams({ reportsPage: String(reportsPage), eventsPage: String(eventsPage), [kind]: String(page) })}`, locale);
  if (!detail) return error ? <Recovery message={error} retry={retry} /> : <p role="status">{t.loading}</p>;
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" });
  return <div className="min-w-0 space-y-10" aria-busy={loading}>
    {error && <Recovery message={error} retry={retry} />}
    <header className="min-w-0 border-y py-6"><h2 className="ts-bidi break-words text-2xl font-semibold">{detail.record.product.name}</h2><p className="mt-2 text-muted-foreground">{t.reasons[detail.record.reason]}</p><CaseFacts record={detail.record} />
      <p className="mt-4 text-sm text-muted-foreground">{t.caseReference}: <bdi className="font-mono text-xs [overflow-wrap:anywhere]" dir="ltr">{id}</bdi></p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={localePath(`/moderation/listings/${detail.record.productId}`, locale)}>{t.inspect}</Link>
      {detail.record.publicReason && <p className="ts-bidi mt-3 max-w-prose whitespace-pre-wrap [overflow-wrap:anywhere]">{detail.record.publicReason}</p>}
    </header>
    <nav aria-label={t.sections} className="flex flex-wrap gap-3">{[["case-evidence", t.evidence], ["case-decision", t.triage], ["case-history", t.history]].map(([target, label]) => <a key={target} href={`#${target}`} className={buttonVariants({ variant: "secondary" })}>{label}</a>)}</nav>
    <section aria-labelledby="case-evidence"><h2 id="case-evidence" tabIndex={-1} className="scroll-mt-24 text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-ring">{t.evidence}</h2><p className="mt-2 text-sm text-muted-foreground">{t.private}</p>
      <div className="mt-5 divide-y border-y">{detail.reports.data.length === 0 ? <p className="py-5 text-muted-foreground">{t.noEvidence}</p> : detail.reports.data.map((report) => <article key={report.id} className="min-w-0 py-5"><p className="max-w-prose whitespace-pre-wrap [overflow-wrap:anywhere]" dir="auto">{report.explanation}</p><p className="mt-3 text-xs text-muted-foreground"><time dateTime={report.createdAt}>{date.format(new Date(report.createdAt))}</time></p></article>)}</div>
      <CasePager meta={detail.reports.meta} href={(page) => href("reportsPage", page)} label={t.evidence} />
    </section>
    <TriageForm record={detail.record} disabled={loading || Boolean(error)} onReload={retry} onDenied={(cause) => { setDetail(null); setError(reportingError(cause, locale)); }} onSaved={(updated) => { setDetail((value) => value && { ...value, record: { ...value.record, ...updated } }); retry(); }} />
    <section aria-labelledby="case-history"><h2 id="case-history" tabIndex={-1} className="scroll-mt-24 text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-ring">{t.history}</h2><div className="mt-5 divide-y border-y">
      {detail.events.data.length === 0 ? <p className="py-5 text-muted-foreground">{t.noEvents}</p> : detail.events.data.map((event) => <article key={event.id} className="min-w-0 space-y-3 py-5 text-sm">
        <h3 className="font-semibold">{t.events[event.action as keyof typeof t.events] ?? event.action} · {t.actors[event.actorType]}</h3>
        <p className="text-muted-foreground"><time dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time> · {t.states[event.resultingState]} · {t.severities[event.resultingSeverity]}</p>
        {event.publicReason && <p className="max-w-prose whitespace-pre-wrap [overflow-wrap:anywhere]" dir="auto">{event.publicReason}</p>}
        <p>{t.reasonCode}: <bdi dir="ltr" className="font-mono text-xs [overflow-wrap:anywhere]">{event.reasonCode}</bdi></p>
        {event.evidenceReference && <p>{t.reference}: <bdi dir="auto" className="[overflow-wrap:anywhere]">{event.evidenceReference}</bdi></p>}
        <p>{t.correlation}: <bdi dir="ltr" className="font-mono text-xs [overflow-wrap:anywhere]">{event.correlationId}</bdi></p>
      </article>)}
    </div><CasePager meta={detail.events.meta} href={(page) => href("eventsPage", page)} label={t.history} /></section>
    <Link className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={localePath("/moderation/cases", locale)}>{t.back}</Link>
  </div>;
}

function TriageForm({ record, disabled, onReload, onDenied, onSaved }: { record: ModerationCaseSummary; disabled: boolean; onReload: () => void; onDenied: (cause: ApiError) => void; onSaved: (value: Pick<ModerationCaseSummary, "state" | "severity" | "version">) => void }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const [action, setAction] = useState<ModerationCaseTriage["action"]>("TRIAGE");
  const [severity, setSeverity] = useState(record.severity);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const closed = record.state === "DISMISSED" || record.state === "ACTIONED";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || needsReload) return;
    const data = new FormData(event.currentTarget);
    pending.current = true; setBusy(true); setMessage(null);
    try {
      const updated = await triageReportCase(record.id, { expectedVersion: record.version, action, severity, reasonCode: String(data.get("reasonCode")).trim(), publicReason: String(data.get("publicReason")).trim(), ...(String(data.get("evidenceReference")).trim() ? { evidenceReference: String(data.get("evidenceReference")).trim() } : {}) });
      setMessage({ error: false, text: t.saved }); onSaved(updated);
    } catch (cause) {
      setMessage({ error: true, text: reportingError(cause, locale) });
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) onDenied(cause);
      else if (cause instanceof ApiError && cause.status === 409) setNeedsReload(true);
    } finally { pending.current = false; setBusy(false); }
  }
  return <section aria-labelledby="case-decision"><h2 id="case-decision" tabIndex={-1} className="scroll-mt-24 text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-ring">{t.triage}</h2>
    {closed ? <p role="status" className="mt-3 text-muted-foreground">{t.closed}</p> : <form className="mt-5 max-w-2xl space-y-5" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={disabled || busy || needsReload} className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">{t.action}<select value={action} onChange={(event) => setAction(event.target.value as ModerationCaseTriage["action"])} className="mt-2 block min-h-11 w-full border border-input bg-background px-3 text-base font-normal">{(Object.keys(t.actions) as ModerationCaseTriage["action"][]).map((value) => <option key={value} value={value}>{t.actions[value]}</option>)}</select></label>
          <label className="text-sm font-semibold">{t.severity}<select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="mt-2 block min-h-11 w-full border border-input bg-background px-3 text-base font-normal">{(Object.keys(t.severities) as typeof severity[]).map((value) => <option key={value} value={value}>{t.severities[value]}</option>)}</select></label>
        </div>
        <label className="block text-sm font-semibold">{t.reasonCode}<span className="mt-1 block font-normal text-muted-foreground">{t.reasonCodeHint}</span><Input className="mt-2 text-base" name="reasonCode" dir="ltr" required minLength={2} maxLength={80} pattern="[A-Z0-9_]+" /></label>
        <label className="block text-sm font-semibold">{t.publicReason}<span className="mt-1 block font-normal text-muted-foreground">{t.publicReasonHint}</span><textarea name="publicReason" dir="auto" required minLength={10} maxLength={1000} rows={4} className="mt-2 block w-full border border-input bg-background p-3 text-base font-normal" /></label>
        <label className="block text-sm font-semibold">{t.evidenceReference}<span className="mt-1 block font-normal text-muted-foreground">{t.evidenceHint}</span><Input name="evidenceReference" className="mt-2 text-base" dir="auto" minLength={2} maxLength={200} /></label>
        <Button type="submit">{busy ? t.saving : t.save}</Button>
      </fieldset>
    </form>}
    {message && <p className={`mt-4 text-sm ${message.error ? "text-destructive" : "text-foreground"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    {needsReload && <Button className="mt-3" variant="secondary" onClick={() => { setNeedsReload(false); onReload(); }}>{t.reload}</Button>}
  </section>;
}

function Recovery({ message, retry }: { message: string; retry: () => void }) {
  const { locale } = useLocale();
  return <div className="space-y-3 border-y py-5"><p role="alert" className="text-sm text-destructive">{message}</p><Button variant="secondary" onClick={retry}>{reportingCopy[locale].retry}</Button></div>;
}

function CasePager({ meta, href, label }: { meta: ProductPageResult["meta"]; href: (page: number) => string; label: string }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const number = new Intl.NumberFormat(intlLocale(locale));
  if (meta.totalPages <= 1 && meta.page === 1) return null;
  return <nav aria-label={label} className="mt-5 flex flex-wrap items-center gap-3">
    {meta.page > 1 && <Link className={buttonVariants({ variant: "secondary" })} scroll={false} href={href(meta.page - 1)}>{t.previous}</Link>}
    <p className="text-sm text-muted-foreground">{t.page.replace("{page}", number.format(meta.page)).replace("{pages}", number.format(Math.max(1, meta.totalPages)))}</p>
    {meta.page < meta.totalPages && <Link className={buttonVariants({ variant: "secondary" })} scroll={false} href={href(meta.page + 1)}>{t.next}</Link>}
  </nav>;
}
