"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3, RotateCcw } from "lucide-react";
import { getCreatorReleases } from "@/lib/api";
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

  useEffect(() => {
    const controller = new AbortController();
    void getCreatorReleases(productId, controller.signal)
      .then((result) => { setHistory(result); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [productId, reload]);

  if (!history && !error) return <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>;
  if (!history) return <div className="rounded-xl border border-destructive/30 bg-surface p-8">
    <p role="alert" className="text-destructive">{copy.loadError}</p>
    <Button className="mt-5" variant="secondary" onClick={() => { setError(false); setReload((value) => value + 1); }}>
      <RotateCcw className="size-4" aria-hidden="true" />{copy.retry}
    </Button>
  </div>;

  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" });
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  return <div className="mx-auto max-w-5xl">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" href={localePath("/creator", locale)}>
      {locale === "fa" ? <ArrowRight className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}{copy.back}
    </Link>
    <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="editorial mt-2 text-4xl sm:text-5xl">{history.listing.name}</h1>
        <h2 className="mt-3 text-xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-muted-foreground">{copy.intro}</p>
      </div>
      <Link className={buttonVariants()} href={localePath(`/creator/listings/${productId}/edit`, locale)}>
        <Layers3 className="size-4" aria-hidden="true" />{copy.prepare}
      </Link>
    </header>
    <p className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{copy.immutableNotice}</p>
    {history.releases.length === 0
      ? <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">{copy.empty}</p>
      : <ol className="mt-6 space-y-4">{history.releases.map((release) => <ReleaseCard key={release.id} release={release} copy={copy} date={date} number={number} />)}</ol>}
  </div>;
}

function ReleaseCard({ release, copy, date, number }: {
  release: CreatorReleaseRecord;
  copy: Record<string, string>;
  date: Intl.DateTimeFormat;
  number: Intl.NumberFormat;
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
    {(!release.sourceResolvedAt || !release.ownershipVerifiedAt) && <p className="mt-4 text-xs text-amber-800 dark:text-amber-300">{!release.sourceResolvedAt ? copy.unresolved : copy.ownershipPending}</p>}
  </li>;
}
