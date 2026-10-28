"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, deleteAccount, exportAccountData } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { GoogleSignIn } from "@/features/account/google-sign-in";
import { accountDataCopy } from "./account-data-copy";
import { accountSecurityCopy } from "./account-security-copy";
import type { ProfileState } from "./account-security";

function download(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "termspace-account-export.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** `profile` is the settings page's single reader-profile request, owned by the security section. */
export function AccountData({ profile: state }: { profile: ProfileState }) {
  const { locale, t } = useLocale();
  const copy = accountDataCopy[locale];
  const security = accountSecurityCopy[locale];
  const session = useMarketplaceSession();
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ text: string; failed: boolean } | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [creatorBlocked, setCreatorBlocked] = useState(false);

  const failure = (cause: unknown, fallback: string) => !(cause instanceof ApiError) ? copy.offline
    : cause.status === 429 ? security.rateLimited
    : cause.status >= 500 ? t.serviceError
    : fallback;

  async function exportData() {
    setExporting(true);
    setExportMessage(null);
    try {
      download(await exportAccountData());
      setExportMessage({ text: copy.exported, failed: false });
    } catch (cause) {
      setExportMessage({ text: failure(cause, copy.exportFailed), failed: true });
    } finally { setExporting(false); }
  }

  const confirmed = state.status === "ready" && confirmation.trim().toLowerCase() === (session.email ?? "").toLowerCase() && confirmation.trim() !== "";

  async function remove(proof: { currentPassword?: string; credential?: string }) {
    if (deleting || !confirmed) return;
    setDeleting(true);
    setDeleteError(null);
    setCreatorBlocked(false);
    try {
      await deleteAccount(proof);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "CREATOR_LISTINGS_ACTIVE") setCreatorBlocked(true);
      else if (cause instanceof ApiError && ["INVALID_CURRENT_PASSWORD", "CURRENT_PASSWORD_REQUIRED"].includes(cause.code)) setDeleteError(copy.invalidPassword);
      else if (cause instanceof ApiError && cause.code === "INVALID_GOOGLE_CREDENTIAL") setDeleteError(copy.googleRejected);
      else if (cause instanceof ApiError && cause.code === "GOOGLE_NOT_CONFIGURED") setDeleteError(copy.googleUnavailable);
      else setDeleteError(failure(cause, copy.deleteFailed));
      setDeleting(false);
      return;
    }
    // A full load starts from the cleared cookie; refreshing the session in place would race the dashboard's sign-in redirect.
    window.location.assign(localePath("/", locale));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void remove({ currentPassword: String(new FormData(event.currentTarget).get("currentPassword") ?? "") });
  }

  return <>
    <section className="border border-border bg-surface p-5" aria-labelledby="account-data-title">
      <h2 id="account-data-title" className="text-xl font-semibold">{copy.dataTitle}</h2>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">{copy.dataIntro}</p>
      <Button className="mt-4" variant="secondary" disabled={exporting} onClick={() => void exportData()}>{exporting ? copy.exporting : copy.exportButton}</Button>
      {exportMessage && <p role={exportMessage.failed ? "alert" : "status"} className={`mt-3 text-sm ${exportMessage.failed ? "text-destructive" : "text-foreground"}`}>{exportMessage.text}</p>}
    </section>

    <section className="border border-destructive/40 bg-surface p-5 [&_input]:scroll-mt-32 [&_button]:scroll-mt-32" aria-labelledby="account-delete-title">
      <h2 id="account-delete-title" className="text-xl font-semibold">{copy.deleteTitle}</h2>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">{copy.deleteIntro}</p>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{copy.deleteKeeps}</p>
      {session.marketplaceRoles.includes("creator") && <p className="mt-2 max-w-prose text-sm font-medium">{copy.creatorNote}</p>}
      {state.status === "loading" ? <p role="status" className="mt-4 text-sm text-muted-foreground">{copy.loading}</p>
        : state.status === "error" ? <p className="mt-4 text-sm text-muted-foreground">{copy.loadError}</p>
        : <form className="mt-5 max-w-xl space-y-4" onSubmit={submit} aria-label={copy.deleteTitle}>
          <fieldset disabled={deleting} className="space-y-4">
            <label className="block text-sm font-medium">{copy.confirmLabel}
              <Input name="confirmEmail" type="email" dir="ltr" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2" />
            </label>
            {state.profile.hasPassword
              ? <>
                <label className="block text-sm font-medium">{copy.passwordLabel}
                  <Input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className="mt-2" />
                </label>
                <Button type="submit" variant="destructive" disabled={!confirmed}>{deleting ? copy.deleting : copy.deleteButton}</Button>
              </>
              : <>
                <p className="text-sm text-muted-foreground">{copy.googleConfirm}</p>
                {confirmed && (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
                  ? <GoogleSignIn locale={locale} disabled={deleting} onCredential={(credential) => remove({ credential })} onUnavailable={() => setDeleteError(copy.googleUnavailable)} />
                  : <p role="alert" className="text-sm text-destructive">{copy.googleUnavailable}</p>)}
              </>}
          </fieldset>
          {creatorBlocked && <div role="alert" className="text-sm text-destructive">
            <p>{copy.creatorBlocked}</p>
            <Link className={`${buttonVariants({ variant: "secondary" })} mt-3`} href={localePath("/dashboard/studio", locale)}>{copy.studioLink}</Link>
          </div>}
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
        </form>}
    </section>
  </>;
}
