"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3, RotateCcw } from "lucide-react";
import { getCreatorReleases, requestSourceCheck } from "@/lib/api";
import type { CreatorReleaseHistory, CreatorReleaseRecord } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { creatorWorkspace } from "./workspace-copy";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProviderConnections } from "./provider-connections";
import { intlLocale } from "@/lib/format";
import { ContextHelp } from "@/components/ui/context-help";

export function CreatorReleaseManager({ productId }: { productId: string }) {
  const { locale, t } = useLocale();
  const copy = { ...t.creatorReleases, ...creatorWorkspace[locale].creatorReleases };
  const [history, setHistory] = useState<CreatorReleaseHistory | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getCreatorReleases(productId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) { setHistory(result); setError(false); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [productId, reload]);

  useEffect(() => {
    if (!history?.releases.some((release) => release.status === "proposed" && release.sourceCheckStatus === "pending")) return;
    const timer = window.setTimeout(() => setReload((value) => value + 1), 3_000);
    return () => window.clearTimeout(timer);
  }, [history]);

  if (!history && !error) return <><p role="status" className="text-sm text-muted-foreground">{copy.loading}</p><ProviderConnections /></>;
  if (!history) return <><ProviderConnections /><div className="rounded-none border border-destructive/30 bg-surface p-8">
    <p role="alert" className="text-destructive">{copy.loadError}</p>
    <Button className="mt-5" variant="secondary" onClick={() => { setError(false); setReload((value) => value + 1); }}>
      <RotateCcw className="size-4" aria-hidden="true" />{copy.retry}
    </Button>
  </div></>;

  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const number = new Intl.NumberFormat(intlLocale(locale));
  const checkSource = async () => {
    setBusy("source"); setActionMessage("");
    try {
      await requestSourceCheck(productId, history.listing.lifecycleVersion);
      setActionMessage(copy.checkQueued);
      setReload((value) => value + 1);
    } catch { setActionMessage(copy.actionError); } finally { setBusy(null); }
  };
  return <div className="mx-auto max-w-5xl">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" href={localePath("/dashboard/studio", locale)}>
      {locale === "fa" ? <ArrowRight className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}{copy.back}
    </Link>
    <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h1 className="font-semibold mt-2 text-2xl sm:text-3xl">{history.listing.name}</h1>
        <div className="mt-3 flex items-start justify-between gap-2"><h2 className="text-xl font-semibold">{copy.title}</h2><ContextHelp label={copy.title} topic="source" /></div>
        <p className="mt-2 text-muted-foreground">{copy.intro}</p>
      </div>
      <Link className={buttonVariants()} href={localePath(`/dashboard/studio/listings/${productId}/edit`, locale)}>
        <Layers3 className="size-4" aria-hidden="true" />{copy.prepare}
      </Link>
    </header>
    <p className="mt-6 border-y py-4 text-sm text-muted-foreground">{copy.immutableNotice}</p>
    <ProviderConnections />
    {actionMessage && <p className="mt-4 text-sm" role="status">{actionMessage}</p>}
    {history.releases.length === 0
      ? <p className="mt-6 rounded-none border border-dashed p-8 text-center text-muted-foreground">{copy.empty}</p>
      : <ol className="mt-6 space-y-4">{history.releases.map((release) => <ReleaseCard key={release.id} release={release} copy={copy} date={date} number={number} busy={busy === "source"} onCheck={checkSource} editHref={localePath(`/dashboard/studio/listings/${productId}/edit`, locale)} />)}</ol>}
  </div>;
}

function ReleaseCard({ release, copy, date, number, busy, onCheck, editHref }: {
  release: CreatorReleaseRecord;
  copy: Record<string, string>;
  date: Intl.DateTimeFormat;
  number: Intl.NumberFormat;
  busy: boolean;
  onCheck: () => Promise<void>;
  editHref: string;
}) {
  const status = release.status === "published" ? copy.published : release.status === "proposed" ? copy.proposed : copy.supersededDraft;
  return <li className="rounded-none border bg-surface p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold" dir="ltr">v{release.version}</h3>
        <span className={cn("rounded-none px-2.5 py-1 text-xs font-semibold", release.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{status}</span>
        {release.isCurrent && <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="size-4" aria-hidden="true" />{copy.current}</span>}
      </div>
      <span className="text-sm text-muted-foreground">{copy.acquisitions}: {number.format(release.acquisitionCount)}</span>
    </div>
    <p className="mt-3 text-sm">{release.notes}</p>
    <dl className="mt-5 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.source}</dt><dd className="mt-1 break-all"><span>{copy[`source_${release.source.kind}`] ?? release.source.kind}</span><br /><bdi dir="ltr">{release.source.url}<br />{release.source.ref}{release.source.path ? ` · ${release.source.path}` : ""}</bdi></dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.integrity}</dt><dd className="mt-1 break-all" dir="ltr">{release.source.integrityDigest ?? "—"}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.created}</dt><dd className="mt-1">{date.format(new Date(release.createdAt))}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.publishedOn}</dt><dd className="mt-1">{release.publishedAt ? date.format(new Date(release.publishedAt)) : "—"}</dd></div>
    </dl>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className={cn("text-xs font-semibold", release.sourceCheckStatus === "verified" ? "text-emerald-700 dark:text-emerald-300" : release.sourceCheckStatus === "restricted" || release.sourceCheckStatus === "failed" ? "text-destructive" : "text-amber-800 dark:text-amber-300")}>{copy.checkStatus}: {copy[`check_${release.sourceCheckStatus}`]}</p>{release.status === "proposed" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void onCheck()}><RotateCcw className="size-4" aria-hidden="true" />{copy.verifySource}</Button>}</div>
    {release.lastSourceErrorCode && <div className="mt-3 space-y-2 text-sm" role="alert">
      <p>{sourceErrorHelp(release.lastSourceErrorCode, copy)}</p>
      <Link className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={editHref}>{copy.prepare}</Link>
      <p className="text-xs text-muted-foreground"><bdi dir="ltr">{release.lastSourceErrorCode}</bdi></p>
    </div>}
  </li>;
}

function sourceErrorHelp(code: string, copy: Record<string, string>) {
  if (code === "OWNERSHIP_PERMISSION_REQUIRED") return copy.sourceOwnershipHelp;
  if (/INTEGRITY|MISMATCH|VERSION_INVALID/.test(code)) return copy.sourceIntegrityHelp;
  if (/401|403|CONNECTION|TOKEN/.test(code)) return copy.sourceConnectionHelp;
  if (/404|NOT_FOUND|PRIVATE_SOURCE|INVALID/.test(code)) return copy.sourceRefHelp;
  return copy.sourceRetryHelp;
}
