"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getEmailPreferences, setEmailPreferences, type EmailPreferences } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { SettingsPanel } from "./settings-panel";
import { accountPreferencesCopy } from "./account-preferences-copy";

type PreferenceKey = keyof EmailPreferences;
type PreferenceState = { status: "loading" } | { status: "error" } | { status: "ready"; preferences: EmailPreferences };

/**
 * Both switches live in one section because they answer one question: what may
 * TermSpace send to this address? Newsletter membership is shared with the
 * public sign-up form, so it reads the subscriber row; moderation email is a
 * reader setting.
 */
export function AccountPreferences() {
  const { locale, t } = useLocale();
  const copy = accountPreferencesCopy[locale];
  const [state, setState] = useState<PreferenceState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<PreferenceKey | null>(null);
  const [result, setResult] = useState<{ text: string; failed: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getEmailPreferences(controller.signal)
      .then((preferences) => { if (!controller.signal.aborted) setState({ status: "ready", preferences }); })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);

  async function toggle(key: PreferenceKey) {
    if (state.status !== "ready" || busy) return;
    const next = !state.preferences[key];
    setBusy(key);
    setResult(null);
    try {
      const saved = await setEmailPreferences({ [key]: next });
      setState({ status: "ready", preferences: saved });
      setResult({
        text: key === "newsletter"
          ? saved.newsletter ? copy.subscribed : copy.unsubscribed
          : saved.moderation ? copy.moderationEnabled : copy.moderationDisabled,
        failed: false,
      });
    } catch (cause) {
      setResult({
        text: !(cause instanceof ApiError) ? copy.failed
          : cause.status === 401 ? copy.sessionExpired
          : cause.status === 429 ? copy.rateLimited
          : cause.status >= 500 ? t.serviceError
          : copy.failed,
        failed: true,
      });
    } finally {
      setBusy(null);
    }
  }

  function retry() {
    setResult(null);
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return <SettingsPanel id="account-preferences" titleId="account-preferences-title" title={copy.title} description={copy.intro}>

    {state.status === "loading" ? <p role="status" className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">{copy.loading}</p>
      : state.status === "error" ? <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <p role="alert" className="text-sm text-destructive">{copy.loadError}</p>
        <Button variant="secondary" onClick={retry}>{copy.retry}</Button>
      </div>
      : <div className="mt-4 divide-y divide-border border-t border-border">
        <PreferenceRow
          id="newsletter"
          label={copy.newsletter}
          help={copy.newsletterHelp}
          checked={state.preferences.newsletter}
          busy={busy === "newsletter"}
          disabled={busy !== null}
          onLabel={copy.on}
          offLabel={copy.off}
          onToggle={() => void toggle("newsletter")}
        />
        <PreferenceRow
          id="moderation"
          label={copy.moderation}
          help={copy.moderationHelp}
          checked={state.preferences.moderation}
          busy={busy === "moderation"}
          disabled={busy !== null}
          onLabel={copy.on}
          offLabel={copy.off}
          onToggle={() => void toggle("moderation")}
        />
      </div>}

    {busy && <p role="status" className="mt-3 text-sm text-muted-foreground">{copy.saving}</p>}
    {result && <p role={result.failed ? "alert" : "status"} className={`mt-3 text-sm ${result.failed ? "text-destructive" : "text-foreground"}`}>{result.text}</p>}
  </SettingsPanel>;
}

function PreferenceRow({
  id,
  label,
  help,
  checked,
  busy,
  disabled,
  onLabel,
  offLabel,
  onToggle,
}: {
  id: string;
  label: string;
  help: string;
  checked: boolean;
  busy: boolean;
  disabled: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
}) {
  const labelId = `${id}-preference-label`;
  const helpId = `${id}-preference-help`;
  return <div className="flex items-center justify-between gap-4 py-4">
    <div className="min-w-0 flex-1">
      <p id={labelId} className="text-sm font-medium">{label}</p>
      <p id={helpId} className="mt-1 text-sm text-muted-foreground">{help}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-sm font-medium">{checked ? onLabel : offLabel}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={helpId}
        aria-busy={busy}
        disabled={disabled}
        onClick={onToggle}
        className="flex h-11 w-14 shrink-0 items-center justify-center rounded-chip disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-11 items-center rounded-chip border p-0.5 motion-safe:transition-colors ${checked ? "justify-end border-primary bg-primary" : "justify-start border-input bg-muted"}`}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
        </span>
      </button>
    </div>
  </div>;
}
