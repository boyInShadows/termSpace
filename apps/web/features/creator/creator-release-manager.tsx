"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Layers3, RotateCcw, ShieldCheck } from "lucide-react";
import { connectProvider, getCreatorReleases, getProviderConnections, requestSourceCheck, revokeProvider } from "@/lib/api";
import type { CreatorReleaseHistory, CreatorReleaseRecord, MarketplaceProviderConnection } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { creatorWorkspace } from "./workspace-copy";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/format";

export function CreatorReleaseManager({ productId }: { productId: string }) {
  const { locale, t } = useLocale();
  const copy = { ...t.creatorReleases, ...creatorWorkspace[locale].creatorReleases };
  const [history, setHistory] = useState<CreatorReleaseHistory | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [connections, setConnections] = useState<MarketplaceProviderConnection[]>([]);
  const [tokens, setTokens] = useState({ github: "", npm: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([getCreatorReleases(productId, controller.signal), getProviderConnections(controller.signal)])
      .then(([result, providerConnections]) => { setHistory(result); setConnections(providerConnections); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [productId, reload]);

  useEffect(() => {
    if (!history?.releases.some((release) => release.status === "proposed" && release.sourceCheckStatus === "pending")) return;
    const timer = window.setTimeout(() => setReload((value) => value + 1), 3_000);
    return () => window.clearTimeout(timer);
  }, [history]);

  if (!history && !error) return <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>;
  if (!history) return <div className="rounded-none border border-destructive/30 bg-surface p-8">
    <p role="alert" className="text-destructive">{copy.loadError}</p>
    <Button className="mt-5" variant="secondary" onClick={() => { setError(false); setReload((value) => value + 1); }}>
      <RotateCcw className="size-4" aria-hidden="true" />{copy.retry}
    </Button>
  </div>;

  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const number = new Intl.NumberFormat(intlLocale(locale));
  const connect = async (provider: "github" | "npm") => {
    setBusy(provider); setActionMessage("");
    try {
      const connection = await connectProvider(provider, tokens[provider]);
      setConnections((current) => [...current.filter((item) => item.provider !== provider), connection]);
      setTokens((current) => ({ ...current, [provider]: "" }));
      setActionMessage(copy.connectionSaved);
    } catch { setActionMessage(copy.actionError); } finally { setBusy(null); }
  };
  const revoke = async (provider: "github" | "npm") => {
    setBusy(provider); setActionMessage("");
    try {
      await revokeProvider(provider);
      setConnections((current) => current.map((item) => item.provider === provider ? { ...item, revokedAt: new Date().toISOString() } : item));
      setActionMessage(copy.connectionRevoked);
    } catch { setActionMessage(copy.actionError); } finally { setBusy(null); }
  };
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
        <h2 className="mt-3 text-xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-muted-foreground">{copy.intro}</p>
      </div>
      <Link className={buttonVariants()} href={localePath(`/dashboard/studio/listings/${productId}/edit`, locale)}>
        <Layers3 className="size-4" aria-hidden="true" />{copy.prepare}
      </Link>
    </header>
    <p className="mt-6 border-y py-4 text-sm text-muted-foreground">{copy.immutableNotice}</p>
    <section className="mt-6 rounded-none border bg-surface p-5 sm:p-6" aria-labelledby="provider-connections-title">
      <div className="flex items-start gap-3"><KeyRound className="mt-1 size-5 text-primary" aria-hidden="true" /><div><h2 id="provider-connections-title" className="text-lg font-semibold">{copy.connectionsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.connectionsIntro}</p></div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{(["github", "npm"] as const).map((provider) => {
        const connection = connections.find((item) => item.provider === provider && !item.revokedAt);
        return <div key={provider} className="rounded-none border p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{provider === "github" ? "GitHub" : "npm"}</h3>{connection && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-4" aria-hidden="true" />{connection.accountLogin}</span>}</div>
          <p id={`${provider}-token-help`} className="mt-3 text-sm text-muted-foreground">{provider === "github" ? copy.githubTokenHelp : copy.npmTokenHelp} <a className="underline underline-offset-4" href={provider === "github" ? "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" : "https://docs.npmjs.com/creating-and-viewing-access-tokens/"}>{copy.tokenDocs}</a></p>
          {connection
            ? <Button className="mt-4" variant="secondary" disabled={busy === provider} onClick={() => void revoke(provider)}>{copy.disconnect}</Button>
            : <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); void connect(provider); }}><label className="text-sm font-medium" htmlFor={`${provider}-token`}>{copy.tokenLabel}</label><input className="h-11 rounded-none border bg-background px-3 text-sm" id={`${provider}-token`} aria-describedby={`${provider}-token-help`} type="password" autoComplete="off" required minLength={8} value={tokens[provider]} onChange={(event) => setTokens((current) => ({ ...current, [provider]: event.target.value }))} /><Button type="submit" disabled={busy === provider}>{copy.connect}</Button></form>}
        </div>;
      })}</div>
      <p className="mt-4 text-sm text-muted-foreground">{copy.connectionMeaning}</p>
      <p className="mt-2 text-sm text-muted-foreground">{copy.tokenRevocation}</p>
      {actionMessage && <p className="mt-4 text-sm" role="status">{actionMessage}</p>}
    </section>
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
