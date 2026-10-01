"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3, RotateCcw } from "lucide-react";
import { getCreatorReleases, requestSourceCheck, request } from "@/lib/api";
import type { CreatorReleaseHistory, CreatorReleaseRecord } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreatorReleaseManager({ productId }: { productId: string }) {
  const { locale, t } = useLocale();
  const copy = t.creatorReleases;
  const [history, setHistory] = useState<CreatorReleaseHistory | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getCreatorReleases(productId, controller.signal)
      .then((result) => { setHistory(result); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [productId, reload]);

  useEffect(() => {
    if (!history?.releases.some((release) => release.status === "proposed" && release.sourceCheckStatus === "pending")) return;
    const timer = window.setTimeout(() => setReload((value) => value + 1), 3_000);
    return () => window.clearTimeout(timer);
  }, [history]);

  if (!history && !error) return <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>;
  if (!history) return <div className="rounded-xl border border-destructive/30 bg-surface p-8">
    <p role="alert" className="text-destructive">{copy.loadError}</p>
    <Button className="mt-5" variant="secondary" onClick={() => { setError(false); setReload((value) => value + 1); }}>
      <RotateCcw className="size-4" aria-hidden="true" />{copy.retry}
    </Button>
  </div>;

  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" });
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const checkSource = async () => {
    setBusy("source"); setActionMessage("");
    try {
      await requestSourceCheck(productId, history.listing.lifecycleVersion);
      setActionMessage(copy.checkQueued);
      setReload((value) => value + 1);
    } catch { setActionMessage(copy.actionError); } finally { setBusy(null); }
  };
  return <div className="mx-auto max-w-5xl">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" href={localePath("/dashboard/creator", locale)}>
      {locale === "fa" ? <ArrowRight className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}{copy.back}
    </Link>
    <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="editorial mt-2 text-4xl sm:text-5xl">{history.listing.name}</h1>
        <h2 className="mt-3 text-xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-muted-foreground">{copy.intro}</p>
      </div>
      <Link className={buttonVariants()} href={localePath(`/dashboard/creator/listings/${productId}/edit`, locale)}>
        <Layers3 className="size-4" aria-hidden="true" />{copy.prepare}
      </Link>
    </header>
    <p className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{copy.immutableNotice}</p>
    <form key={`${history.listing.maintenanceStatus}:${history.listing.maintenanceNote}`} className="mt-6 space-y-3 rounded-xl border bg-surface p-5" onSubmit={async (event) => {
      event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy("maintenance"); setActionMessage("");
      try { await request(`/api/marketplace/creator/products/${productId}/maintenance`, { method: "PUT", body: JSON.stringify({ status: fields.get("status"), note: String(fields.get("note") ?? "").trim() || null }) }); setActionMessage(locale === "fa" ? "وضعیت نگهداری ذخیره شد." : "Maintenance status saved."); setReload((value) => value + 1); }
      catch (cause) { setActionMessage((cause as Error).message); } finally { setBusy(null); }
    }}>
      <h2 className="font-semibold">{locale === "fa" ? "وضعیت نگهداری" : "Maintenance status"}</h2>
      <label className="block text-sm">{locale === "fa" ? "وضعیت" : "Status"}<select name="status" defaultValue={history.listing.maintenanceStatus ?? "ACTIVE"} className="mt-2 block w-full rounded border bg-background p-2"><option value="ACTIVE">{locale === "fa" ? "فعال" : "Active"}</option><option value="DEPRECATED">{locale === "fa" ? "منسوخ" : "Deprecated"}</option><option value="ABANDONED">{locale === "fa" ? "رهاشده" : "Abandoned"}</option></select></label>
      <label className="block text-sm">{locale === "fa" ? "توضیح عمومی" : "Public explanation"}<textarea name="note" defaultValue={history.listing.maintenanceNote ?? ""} maxLength={1000} className="mt-2 block min-h-20 w-full rounded border bg-background p-2" /></label>
      <Button disabled={busy !== null}>{locale === "fa" ? "ذخیره وضعیت" : "Save status"}</Button>
    </form>
    <Link className={`${buttonVariants({ variant: "secondary" })} mt-6`} href={localePath("/dashboard/connections", locale)}>{copy.connectionsTitle}</Link>
    {actionMessage && <p className="mt-4 text-sm" role="status">{actionMessage}</p>}
    {history.releases.length === 0
      ? <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">{copy.empty}</p>
      : <ol className="mt-6 space-y-4">{history.releases.map((release) => <ReleaseCard key={release.id} release={release} copy={copy} date={date} number={number} busy={busy === "source"} onCheck={checkSource} />)}</ol>}
  </div>;
}

function ReleaseCard({ release, copy, date, number, busy, onCheck }: {
  release: CreatorReleaseRecord;
  copy: Record<string, string>;
  date: Intl.DateTimeFormat;
  number: Intl.NumberFormat;
  busy: boolean;
  onCheck: () => Promise<void>;
}) {
  const status = release.status === "published" ? copy.published : release.status === "proposed" ? copy.proposed : copy.supersededDraft;
  return <li className="rounded-2xl border bg-surface p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold" dir="ltr">v{release.version}</h3>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", release.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{status}</span>
        {release.isCurrent && <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="size-4" aria-hidden="true" />{copy.current}</span>}
      </div>
      <span className="text-sm text-muted-foreground">{copy.acquisitions}: {number.format(release.acquisitionCount)}</span>
    </div>
    <p className="mt-3 text-sm">{release.notes}</p>
    <dl className="mt-5 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.source}</dt><dd className="mt-1 break-all" dir="ltr">{release.source.kind} · {release.source.url}<br />{release.source.ref}{release.source.path ? ` · ${release.source.path}` : ""}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.integrity}</dt><dd className="mt-1 break-all" dir="ltr">{release.source.integrityDigest ?? "—"}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.created}</dt><dd className="mt-1">{date.format(new Date(release.createdAt))}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.publishedOn}</dt><dd className="mt-1">{release.publishedAt ? date.format(new Date(release.publishedAt)) : "—"}</dd></div>
    </dl>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className={cn("text-xs font-semibold", release.sourceCheckStatus === "verified" ? "text-emerald-700 dark:text-emerald-300" : release.sourceCheckStatus === "restricted" || release.sourceCheckStatus === "failed" ? "text-destructive" : "text-amber-800 dark:text-amber-300")}>{copy.checkStatus}: {copy[`check_${release.sourceCheckStatus}`]}</p>{release.status === "proposed" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void onCheck()}><RotateCcw className="size-4" aria-hidden="true" />{copy.verifySource}</Button>}</div>
    {release.lastSourceErrorCode && <p className="mt-2 text-xs text-muted-foreground" dir="ltr">{release.lastSourceErrorCode}</p>}
  </li>;
}
