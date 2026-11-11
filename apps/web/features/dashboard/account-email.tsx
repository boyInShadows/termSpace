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
import { SettingRow, useReturnFocus } from "./settings-panel";
import type { ProfileState } from "./account-security";

/**
 * The email row of the sign-in panel. `profile` is the settings page's single reader-profile
 * request, owned by the security section; the address itself comes from the session.
 */
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
  const changeButton = useReturnFocus(open);

  function close() {
    setError(null);
    setOpen(false);
  }

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
      close();
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

  const canChange = state.status === "ready" && state.profile.hasPassword;
  return <SettingRow
    label={text.email}
    value={<bdi dir="ltr" className="break-all text-foreground">{session.email}</bdi>}
    action={canChange && !open && <Button ref={changeButton} size="sm" variant="secondary" aria-label={text.changeEmail} aria-expanded={false} onClick={() => { setOpen(true); setSent(false); }}>{text.change}</Button>}
  >
    {state.status === "ready" && !state.profile.hasPassword && <p className="mt-2 max-w-prose text-sm text-muted-foreground">{copy.googleManaged}</p>}
    {sent && !open && <p role="status" className="mt-3 max-w-prose text-sm text-success">{copy.sent}</p>}
    {open && <form className="mt-4 max-w-xl space-y-4" onSubmit={submit} aria-label={copy.title}>
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
        <Button type="button" variant="ghost" disabled={busy} onClick={() => close()}>{text.cancel}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </form>}
  </SettingRow>;
}
