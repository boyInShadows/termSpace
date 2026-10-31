"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getNewsletterPreference, setNewsletterPreference } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { accountPreferencesCopy } from "./account-preferences-copy";

type PreferenceState = { status: "loading" } | { status: "error" } | { status: "ready"; newsletter: boolean };

/**
 * The newsletter list is shared with the public sign-up form, so this section
 * reads and writes the reader's own subscriber row instead of keeping a copy.
 */
export function AccountPreferences() {
  const { locale, t } = useLocale();
  const copy = accountPreferencesCopy[locale];
  const [state, setState] = useState<PreferenceState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; failed: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getNewsletterPreference(controller.signal)
      .then(({ newsletter }) => { if (!controller.signal.aborted) setState({ status: "ready", newsletter }); })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);

  async function toggle() {
    if (state.status !== "ready" || busy) return;
    const next = !state.newsletter;
    setBusy(true);
    setResult(null);
    try {
      const saved = await setNewsletterPreference(next);
      setState({ status: "ready", newsletter: saved.newsletter });
      setResult({ text: saved.newsletter ? copy.subscribed : copy.unsubscribed, failed: false });
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
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return <section className="rounded-card border border-border bg-surface p-5" aria-labelledby="account-preferences-title">
    <h2 id="account-preferences-title" className="text-xl font-semibold">{copy.title}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{copy.intro}</p>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
      <div className="min-w-0 max-w-prose">
        <p id="newsletter-preference-label" className="text-sm font-medium">{copy.newsletter}</p>
        <p id="newsletter-preference-help" className="mt-1 text-sm text-muted-foreground">{copy.newsletterHelp}</p>
      </div>

      {state.status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>
        : state.status === "error" ? <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{copy.loadError}</p>
          <Button variant="secondary" onClick={retry}>{copy.retry}</Button>
        </div>
        : <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{state.newsletter ? copy.on : copy.off}</span>
          <button
            type="button"
            role="switch"
            aria-checked={state.newsletter}
            aria-labelledby="newsletter-preference-label"
            aria-describedby="newsletter-preference-help"
            aria-busy={busy}
            disabled={busy}
            onClick={() => void toggle()}
            className="flex h-11 w-14 shrink-0 items-center justify-center rounded-chip disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-11 items-center rounded-chip border p-0.5 motion-safe:transition-colors ${state.newsletter ? "justify-end border-primary bg-primary" : "justify-start border-input bg-muted"}`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </span>
          </button>
        </div>}
    </div>

    {busy && <p role="status" className="mt-3 text-sm text-muted-foreground">{copy.saving}</p>}
    {result && <p role={result.failed ? "alert" : "status"} className={`mt-3 text-sm ${result.failed ? "text-destructive" : "text-foreground"}`}>{result.text}</p>}
  </section>;
}
