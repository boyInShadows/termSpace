"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { connectProvider, getProviderConnections, revokeProvider } from "@/lib/api";
import type { MarketplaceProviderConnection } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";

export function ProviderConnections() {
  const { t } = useLocale();
  const copy = t.creatorReleases;
  const [connections, setConnections] = useState<MarketplaceProviderConnection[]>([]);
  const [tokens, setTokens] = useState({ github: "", npm: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getProviderConnections(controller.signal)
      .then((result) => { setConnections(result); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  async function connect(provider: "github" | "npm") {
    setBusy(provider); setActionMessage("");
    try {
      const connection = await connectProvider(provider, tokens[provider]);
      setConnections((current) => [...current.filter((item) => item.provider !== provider), connection]);
      setActionMessage(copy.connectionSaved);
    } catch { setActionMessage(copy.actionError); }
    finally { setTokens((current) => ({ ...current, [provider]: "" })); setBusy(null); }
  }

  async function revoke(provider: "github" | "npm") {
    setBusy(provider); setActionMessage("");
    try {
      await revokeProvider(provider);
      setConnections((current) => current.map((item) => item.provider === provider ? { ...item, revokedAt: new Date().toISOString() } : item));
      setActionMessage(copy.connectionRevoked);
    } catch { setActionMessage(copy.actionError); } finally { setBusy(null); }
  }

  if (loading) return <p role="status">{t.wait}</p>;
  if (error) return <div className="rounded-xl border bg-surface p-7">
    <p role="alert" className="text-destructive">{copy.actionError}</p>
    <Button className="mt-4" variant="secondary" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>{copy.retry}</Button>
  </div>;

  return <section className="rounded-2xl border bg-surface p-5 sm:p-7" aria-labelledby="provider-connections-title">
    <div className="flex items-start gap-3"><KeyRound className="mt-1 size-5 text-primary" aria-hidden="true" /><div><h1 id="provider-connections-title" className="editorial text-3xl">{copy.connectionsTitle}</h1><p className="mt-3 text-muted-foreground">{copy.connectionsIntro}</p></div></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{(["github", "npm"] as const).map((provider) => {
      const connection = connections.find((item) => item.provider === provider && !item.revokedAt);
      return <div key={provider} className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{provider === "github" ? "GitHub" : "npm"}</h2>{connection && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-4" aria-hidden="true" />{connection.accountLogin}</span>}</div>
        {connection
          ? <Button className="mt-4" variant="secondary" disabled={busy === provider} onClick={() => void revoke(provider)}>{copy.disconnect}</Button>
          : <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); void connect(provider); }}><label className="text-sm font-medium" htmlFor={`${provider}-token`}>{copy.tokenLabel}</label><input className="h-11 rounded-lg border bg-background px-3 text-sm" id={`${provider}-token`} type="password" autoComplete="off" required minLength={8} value={tokens[provider]} onChange={(event) => setTokens((current) => ({ ...current, [provider]: event.target.value }))} /><Button type="submit" disabled={busy === provider}>{copy.connect}</Button></form>}
      </div>;
    })}</div>
    {actionMessage && <p className="mt-4 text-sm" role="status">{actionMessage}</p>}
  </section>;
}
