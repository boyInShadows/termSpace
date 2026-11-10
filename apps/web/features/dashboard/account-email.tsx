"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { requestEmailChange } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailChangeCopy } from "@/features/account/email-change-copy";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { accountSecurityCopy } from "./account-security-copy";
import { accountSettingsCopy } from "./account-settings-copy";
import { SettingsPanel } from "./settings-panel";
import type { ProfileState } from "./account-security";

/** `profile` is the settings page's single reader-profile request, owned by the security section. */
export function AccountEmail({ profile: state }: { profile: ProfileState }) {
  const { locale, t } = useLocale();
  const copy = emailChangeCopy[locale];
  const security = accountSecurityCopy[locale];
  const text = accountSettingsCopy[locale];
  const session = useMarketplaceSession();
  const [open, setOpen] = useState(false);
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
      setSent(true);
      setOpen(false);
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

  return <SettingsPanel titleId="account-email-title" title={copy.title}>
    <p className="mt-3 text-sm"><span className="text-muted-foreground">{text.currentEmail}</span>{" "}<bdi dir="ltr" className="break-all font-medium">{session.email}</bdi></p>
    {state.status === "loading" ? <p role="status" className="mt-3 text-sm text-muted-foreground">{copy.loading}</p>
      : state.status === "error" ? <p className="mt-3 text-sm text-muted-foreground">{copy.loadError}</p>
      : !state.profile.hasPassword ? <p className="mt-3 max-w-prose text-sm text-muted-foreground">{copy.googleManaged}</p>
      : !open ? <>
        <Button className="mt-4" variant="secondary" aria-expanded={false} onClick={() => { setOpen(true); setSent(false); }}>{text.changeEmail}</Button>
        {sent && <p role="status" className="mt-3 max-w-prose text-sm text-foreground">{copy.sent}</p>}
      </>
      : <form className="mt-4 max-w-xl space-y-4" onSubmit={submit} aria-label={copy.title}>
        <p className="max-w-prose text-sm text-muted-foreground">{copy.intro}</p>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm font-medium">{copy.newEmailLabel}
            <Input name="newEmail" type="email" dir="ltr" required maxLength={320} autoComplete="email" autoFocus className="mt-2" />
          </label>
          <label className="block text-sm font-medium">{copy.passwordLabel}
            <Input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className="mt-2" />
          </label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>{busy ? copy.sending : copy.submit}</Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => { setOpen(false); setError(null); }}>{text.cancel}</Button>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
      </form>}
  </SettingsPanel>;
}
