"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { reportListing } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { ListingReportReason } from "@/lib/types";
import { reportingCopy, reportingError } from "./copy";

export function ListingReportForm({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const t = reportingCopy[locale];
  const session = useMarketplaceSession();
  const fieldId = useId();
  const pending = useRef(false);
  const [reason, setReason] = useState<ListingReportReason>("MALICIOUS");
  const [explanation, setExplanation] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const account = `${localePath("/account", locale)}?next=${encodeURIComponent(localePath(`/products/${slug}`, locale))}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (explanation.trim().length < 20) { setError(t.invalid); return; }
    pending.current = true; setBusy(true); setError(null);
    try { setReceipt((await reportListing(slug, { reason, explanation: explanation.trim() })).receiptId); }
    catch (cause) { setError(reportingError(cause, locale)); }
    finally { pending.current = false; setBusy(false); }
  }

  return <div className="space-y-4 pb-2 pt-3">
      {session.identityLoading ? <p role="status" className="text-sm text-muted-foreground">{t.loading}</p> : !session.email ? <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4" href={account}>{t.signIn}</Link> : receipt ? <div role="status" className="space-y-2 text-sm">
        <p className="font-semibold">{t.received}</p><p className="text-muted-foreground">{t.receivedHint}</p>
        <p>{t.receipt}: <bdi className="[overflow-wrap:anywhere] font-mono text-xs" dir="ltr">{receipt}</bdi></p>
      </div> : <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.intro}</p>
        <p id={`${fieldId}-privacy`} className="text-sm text-muted-foreground">{t.privacy}</p>
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <label className="block text-sm font-semibold">{t.reason}<select value={reason} onChange={(event) => setReason(event.target.value as ListingReportReason)} className="mt-2 min-h-11 w-full min-w-0 border border-input bg-background px-2 text-base font-normal">
            {(Object.keys(t.reasons) as ListingReportReason[]).map((value) => <option key={value} value={value}>{t.reasons[value]}</option>)}
          </select></label>
          <label className="block text-sm font-semibold" htmlFor={`${fieldId}-explanation`}>{t.explanation}</label>
          <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">{t.explanationHint}</p>
          <textarea id={`${fieldId}-explanation`} required minLength={20} maxLength={4000} value={explanation} onChange={(event) => setExplanation(event.target.value)} aria-describedby={`${fieldId}-hint ${fieldId}-privacy`} dir="auto" rows={5} className="block w-full min-w-0 border border-input bg-background p-3 text-base" />
          <Button type="submit" className="w-full">{busy ? t.sending : t.send}</Button>
        </fieldset>
        {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p>{error === t.unauthorized && <Link href={account} className="inline-flex min-h-11 items-center font-semibold underline">{t.signIn}</Link>}</div>}
      </form>}
  </div>;
}
