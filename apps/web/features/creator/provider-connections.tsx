"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { connectProvider, getProviderConnections, revokeProvider } from "@/lib/api";
import type { MarketplaceProviderConnection } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContextHelp } from "@/components/ui/context-help";
import { SettingRow, SettingRows, SettingsPanel } from "@/features/dashboard/settings-panel";
import { accountSettingsCopy } from "@/features/dashboard/account-settings-copy";
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
  // The provider whose token form is open; a connected provider shows Disconnect instead.
  const [opening, setOpening] = useState<"github" | "npm" | null>(null);
  // Connect, Cancel and Disconnect each replace the focused button; put focus on the row's new action.
  const [refocus, setRefocus] = useState<"github" | "npm" | null>(null);
  useEffect(() => {
    if (!refocus) return;
    document.getElementById(`${refocus}-connection-action`)?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRefocus(null);
  }, [refocus]);

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
      setOpening(null);
      setRefocus(provider);
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
      setRefocus(provider);
    } catch { setActionMessage(copy.actionError); setActionFailed(true); }
    finally { setBusy(null); }
  }

  const text = accountSettingsCopy[locale];
  return (
    <SettingsPanel
      titleId="provider-connections-title"
      title={copy.connectionsTitle}
      description={copy.connectionsIntro}
      action={<ContextHelp label={copy.connectionsTitle} topic="provider" />}
    >
      {error ? <div className="mt-5"><p role="alert" className="text-sm text-destructive">{connectionCopy[locale].error}</p><Button className="mt-3" variant="secondary" onClick={() => { setError(false); setConnections(null); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div>
        : connections === null ? <p role="status" className="mt-5 text-sm text-muted-foreground">{connectionCopy[locale].loading}</p>
        : <SettingRows>{(["github", "npm"] as const).map((provider) => {
          const connection = connections.find((item) => item.provider === provider && !item.revokedAt);
          const open = opening === provider && !connection;
          return <SettingRow
            key={provider}
            label={provider === "github" ? "GitHub" : "npm"}
            value={connection
              ? <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-success"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" /><span className="sr-only">{text.connectedAs} </span><bdi dir="ltr" className="break-all">{connection.accountLogin}</bdi></span>
              : text.notConnected}
            action={connection
              ? <Button id={`${provider}-connection-action`} size="sm" variant="secondary" disabled={busy !== null} onClick={() => void revoke(provider)}>{copy.disconnect}</Button>
              : !open && <Button id={`${provider}-connection-action`} size="sm" variant="secondary" aria-expanded={false} aria-label={`${text.connect} ${provider === "github" ? "GitHub" : "npm"}`} onClick={() => { setOpening(provider); setActionMessage(""); }}>{text.connect}</Button>}
          >
            {open && <form className="mt-4 max-w-xl space-y-3" onSubmit={(event) => { event.preventDefault(); void connect(provider); }}>
              <p id={`${provider}-token-help`} className="max-w-prose text-sm text-muted-foreground">{provider === "github" ? copy.githubTokenHelp : copy.npmTokenHelp} <a className="underline underline-offset-4" href={provider === "github" ? "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" : "https://docs.npmjs.com/creating-and-viewing-access-tokens/"}>{copy.tokenDocs}</a></p>
              <label className="block text-sm font-medium" htmlFor={`${provider}-token`}>{copy.tokenLabel}</label>
              <Input className="min-w-0" id={`${provider}-token`} aria-describedby={`${provider}-token-help`} type="password" autoComplete="off" autoFocus required minLength={8} disabled={busy !== null} value={tokens[provider]} onChange={(event) => setTokens((current) => ({ ...current, [provider]: event.target.value }))} />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={busy !== null}>{copy.connect}</Button>
                <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => { setOpening(null); setRefocus(provider); setTokens((current) => ({ ...current, [provider]: "" })); }}>{text.cancel}</Button>
              </div>
            </form>}
          </SettingRow>;
        })}</SettingRows>}
      {actionMessage && <p className={`mt-4 text-sm ${actionFailed ? "text-destructive" : "text-foreground"}`} role={actionFailed ? "alert" : "status"}>{actionMessage}</p>}
      <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <p>{copy.connectionMeaning}</p>
        <p>{copy.tokenRevocation}</p>
      </div>
    </SettingsPanel>
  );
}
