"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, changeReaderPassword, getReaderProfile } from "@/lib/api";
import { revokeOtherSessions } from "@/lib/account-api";
import type { ReaderProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { intlLocale } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accountSecurityCopy } from "./account-security-copy";

export type ProfileState = { status: "loading" } | { status: "error" } | { status: "ready"; profile: ReaderProfile };

/** `onProfileState` lets the settings page reuse this one profile request instead of repeating it. */
export function AccountSecurity({ onProfileState }: { onProfileState?: (state: ProfileState) => void } = {}) {
  const { locale, t } = useLocale();
  const copy = accountSecurityCopy[locale];
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [othersResult, setOthersResult] = useState<{ text: string; failed: boolean } | null>(null);

  useEffect(() => { onProfileState?.(state); }, [state, onProfileState]);

  useEffect(() => {
    const controller = new AbortController();
    void getReaderProfile(controller.signal)
      .then((profile) => { if (!controller.signal.aborted) setState({ status: "ready", profile }); })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || state.status !== "ready" || !state.profile.hasPassword) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword"));
    const newPassword = String(data.get("newPassword"));
    setError(null);
    setSaved(false);
    if (newPassword !== String(data.get("confirmPassword"))) {
      setError(t.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      await changeReaderPassword(currentPassword, newPassword);
      form.reset();
      setSaved(true);
    } catch (cause) {
      const messages: Record<string, string> = {
        INVALID_CURRENT_PASSWORD: copy.invalidCurrent,
        CURRENT_PASSWORD_REQUIRED: copy.invalidCurrent,
        PASSWORD_UNCHANGED: t.passwordUnchanged,
        PASSWORD_SETUP_REQUIRES_REAUTH: copy.noPasswordIntro,
      };
      setError(cause instanceof ApiError ? cause.status === 429 ? copy.rateLimited : messages[cause.code] ?? t.serviceError : t.serviceError);
    } finally { setBusy(false); }
  }

  async function signOutOthers() {
    setSigningOutOthers(true);
    setOthersResult(null);
    try {
      const { revoked } = await revokeOtherSessions();
      setOthersResult({ text: revoked > 0 ? copy.othersSignedOut : copy.noOtherSessions, failed: false });
    } catch (cause) {
      setOthersResult({
        text: !(cause instanceof ApiError) ? copy.requestOffline : cause.status === 429 ? copy.rateLimited : cause.status >= 500 ? t.serviceError : copy.signOutOthersFailed,
        failed: true,
      });
    } finally { setSigningOutOthers(false); }
  }

  return <section className="border border-border bg-surface p-5 [&_input]:scroll-mt-32 [&_button]:scroll-mt-32 [&_input]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))] [&_button]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]" aria-labelledby="account-security-title">
    <h2 id="account-security-title" className="text-xl font-semibold">{copy.title}</h2>
    {state.status === "loading" ? <p role="status" className="mt-4 text-sm text-muted-foreground">{copy.loading}</p>
      : state.status === "error" ? <div className="mt-4">
        <p role="alert" className="text-sm text-destructive">{copy.loadError}</p>
        <Button variant="secondary" className="mt-3" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>{t.dashboardHome.retry}</Button>
      </div> : <>
        <dl className="mt-4 divide-y divide-border text-sm">
          <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-medium">{copy.memberSince}</dt><dd className="text-muted-foreground"><time dateTime={state.profile.createdAt}>{new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(state.profile.createdAt))}</time></dd></div>
          <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-medium">{copy.signInMethod}</dt><dd className="text-muted-foreground">{state.profile.hasPassword ? state.profile.connectedGoogle ? copy.bothSignIn : copy.passwordSignIn : state.profile.connectedGoogle ? copy.googleSignIn : copy.noPassword}</dd></div>
        </dl>
        {state.profile.hasPassword ? <form className="mt-5 max-w-xl space-y-4" onSubmit={submit} aria-label={copy.savePassword}>
          <p id="password-change-help" className="text-sm text-muted-foreground">{copy.intro}</p>
          <fieldset disabled={busy} className="space-y-4" aria-describedby="password-change-help">
            <label className="block text-sm font-medium">{copy.currentPassword}<Input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className="mt-2 rounded-none" /></label>
            <label className="block text-sm font-medium">{t.newPassword}<Input name="newPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-2 rounded-none" /></label>
            <label className="block text-sm font-medium">{t.confirmPassword}<Input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-2 rounded-none" /></label>
            <Button type="submit">{busy ? t.wait : copy.savePassword}</Button>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {saved && <p role="status" className="text-sm text-foreground">{copy.saved}</p>}
        </form> : <p className="mt-5 text-sm text-muted-foreground">{copy.noPasswordIntro}</p>}
        <div className="mt-6 border-t border-border pt-5">
          <p id="sign-out-others-help" className="max-w-prose text-sm text-muted-foreground">{copy.signOutOthersHelp}</p>
          <Button className="mt-3" variant="secondary" disabled={signingOutOthers} aria-describedby="sign-out-others-help" onClick={() => void signOutOthers()}>{signingOutOthers ? copy.signingOutOthers : copy.signOutOthers}</Button>
          {othersResult && <p role={othersResult.failed ? "alert" : "status"} className={`mt-3 text-sm ${othersResult.failed ? "text-destructive" : "text-foreground"}`}>{othersResult.text}</p>}
        </div>
      </>}
  </section>;
}
