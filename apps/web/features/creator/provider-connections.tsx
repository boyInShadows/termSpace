"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { connectProvider, getProviderConnections, revokeProvider } from "@/lib/api";
import type { MarketplaceProviderConnection } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { ContextHelp } from "@/components/ui/context-help";
import { creatorWorkspace } from "./workspace-copy";

const connectionCopy = {
  en: { loading: "Loading provider connections…", error: "Provider connections could not be loaded." },
  fa: { loading: "در حال بارگذاری اتصال ارائه‌دهندگان…", error: "بارگذاری اتصال ارائه‌دهندگان انجام نشد." },
};

export function ProviderConnections() {
  const { locale, t } = useLocale();
  const copy = { ...t.creatorReleases, ...creatorWorkspace[locale].creatorReleases };
  const [connections, setConnections] = useState<MarketplaceProviderConnection[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tokens, setTokens] = useState({ github: "", npm: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionFailed, setActionFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getProviderConnections(controller.signal).then((result) => {
      if (!controller.signal.aborted) { setConnections(result); setError(false); }
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  async function connect(provider: "github" | "npm") {
    if (busy) return;
    setBusy(provider); setActionMessage(""); setActionFailed(false);
    try {
      const connection = await connectProvider(provider, tokens[provider]);
      setConnections((current) => [...(current ?? []).filter((item) => item.provider !== provider), connection]);
      setActionMessage(copy.connectionSaved);
    } catch { setActionMessage(copy.actionError); setActionFailed(true); }
    finally { setTokens((current) => ({ ...current, [provider]: "" })); setBusy(null); }
  }
  async function revoke(provider: "github" | "npm") {
    if (busy) return;
    setBusy(provider); setActionMessage(""); setActionFailed(false);
    try {
      await revokeProvider(provider);
      setConnections((current) => (current ?? []).filter((item) => item.provider !== provider));
      setActionMessage(copy.connectionRevoked);
    } catch { setActionMessage(copy.actionError); setActionFailed(true); }
    finally { setBusy(null); }
  }

  return (
    <section className="mt-6 rounded-none border bg-surface p-5 sm:p-6" aria-labelledby="provider-connections-title">
      <div className="flex items-start gap-3"><KeyRound className="mt-1 size-5 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 id="provider-connections-title" className="text-lg font-semibold">{copy.connectionsTitle}</h2><ContextHelp label={copy.connectionsTitle} topic="provider" /></div><p className="mt-1 text-sm text-muted-foreground">{copy.connectionsIntro}</p></div></div>
      {error ? <div className="mt-5"><p role="alert" className="text-sm text-destructive">{connectionCopy[locale].error}</p><Button className="mt-3" variant="secondary" onClick={() => { setError(false); setConnections(null); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div> : connections === null ? <p role="status" className="mt-5 text-sm text-muted-foreground">{connectionCopy[locale].loading}</p> : <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">{(["github", "npm"] as const).map((provider) => {
        const connection = connections?.find((item) => item.provider === provider && !item.revokedAt);
        return <div key={provider} className="rounded-none border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{provider === "github" ? "GitHub" : "npm"}</h3>{connection && <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" /><bdi className="break-all">{connection.accountLogin}</bdi></span>}</div>
          <p id={`${provider}-token-help`} className="mt-3 text-sm text-muted-foreground">{provider === "github" ? copy.githubTokenHelp : copy.npmTokenHelp} <a className="underline underline-offset-4" href={provider === "github" ? "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" : "https://docs.npmjs.com/creating-and-viewing-access-tokens/"}>{copy.tokenDocs}</a></p>
          {connection
            ? <Button className="mt-4" variant="secondary" disabled={busy !== null} onClick={() => void revoke(provider)}>{copy.disconnect}</Button>
            : <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); void connect(provider); }}><label className="text-sm font-medium" htmlFor={`${provider}-token`}>{copy.tokenLabel}</label><input className="h-11 w-full min-w-0 rounded-none border bg-background px-3 text-base" id={`${provider}-token`} aria-describedby={`${provider}-token-help`} type="password" autoComplete="off" required minLength={8} disabled={busy !== null} value={tokens[provider]} onChange={(event) => setTokens((current) => ({ ...current, [provider]: event.target.value }))} /><Button type="submit" disabled={busy !== null}>{copy.connect}</Button></form>}
        </div>;
      })}</div>}
      <p className="mt-4 text-sm text-muted-foreground">{copy.connectionMeaning}</p>
      <p className="mt-2 text-sm text-muted-foreground">{copy.tokenRevocation}</p>
      {actionMessage && <p className="mt-4 text-sm" role={actionFailed ? "alert" : "status"}>{actionMessage}</p>}
    </section>
  );
}
