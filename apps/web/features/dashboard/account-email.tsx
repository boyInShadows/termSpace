"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { requestEmailChange } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailChangeCopy } from "@/features/account/email-change-copy";
import { accountSecurityCopy } from "./account-security-copy";
import type { ProfileState } from "./account-security";

/** `profile` is the settings page's single reader-profile request, owned by the security section. */
export function AccountEmail({ profile: state }: { profile: ProfileState }) {
  const { locale, t } = useLocale();
  const copy = emailChangeCopy[locale];
  const security = accountSecurityCopy[locale];
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setSent(false);
    setError(null);
    try {
      await requestEmailChange(String(data.get("newEmail")), String(data.get("currentPassword")));
      form.reset();
      setSent(true);
    } catch (cause) {
      const codes: Record<string, string> = {
        INVALID_CURRENT_PASSWORD: copy.invalidPassword,
        EMAIL_UNCHANGED: copy.unchanged,
        EMAIL_CHANGE_COOLDOWN: copy.cooldown,
      };
      setError(!(cause instanceof ApiError) ? copy.offline
        : codes[cause.code] ?? (cause.status === 429 ? security.rateLimited : cause.status >= 500 ? t.serviceError : cause.status === 400 ? copy.invalidEmail : copy.failed));
    } finally { setBusy(false); }
  }

  return <section className="border border-border bg-surface p-5 [&_input]:scroll-mt-32 [&_button]:scroll-mt-32" aria-labelledby="account-email-title">
    <h2 id="account-email-title" className="text-xl font-semibold">{copy.title}</h2>
    {state.status === "loading" ? <p role="status" className="mt-4 text-sm text-muted-foreground">{copy.loading}</p>
      : state.status === "error" ? <p className="mt-4 text-sm text-muted-foreground">{copy.loadError}</p>
      : !state.profile.hasPassword ? <p className="mt-3 max-w-prose text-sm text-muted-foreground">{copy.googleManaged}</p>
      : <form className="mt-3 max-w-xl space-y-4" onSubmit={submit} aria-label={copy.title}>
        <p className="max-w-prose text-sm text-muted-foreground">{copy.intro}</p>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm font-medium">{copy.newEmailLabel}
            <Input name="newEmail" type="email" dir="ltr" required maxLength={320} autoComplete="email" className="mt-2" />
          </label>
          <label className="block text-sm font-medium">{copy.passwordLabel}
            <Input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className="mt-2" />
          </label>
          <Button type="submit">{busy ? copy.sending : copy.submit}</Button>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {sent && <p role="status" className="text-sm text-foreground">{copy.sent}</p>}
      </form>}
  </section>;
}
