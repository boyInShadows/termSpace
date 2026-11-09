"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createSupportTicket, type SupportCategory } from "@/lib/support-api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { supportCopy, supportFailureCopy } from "./support-copy";
import { ScreenshotPicker } from "./screenshot-picker";

export const supportFieldClass = "min-h-11 w-full rounded-control border border-input bg-surface px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring";

export function NewTicketForm() {
  const { locale } = useLocale();
  const c = supportCopy[locale];
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);

  return <form className="space-y-6" aria-busy={pending} onSubmit={async (event) => {
    event.preventDefault();
    if (busy.current) return;
    const form = new FormData(event.currentTarget);
    busy.current = true; setPending(true); setError(null); setExpired(false);
    try {
      const ticket = await createSupportTicket({ category: form.get("category") as SupportCategory, subject: String(form.get("subject")), body: String(form.get("body")) }, screenshots);
      router.push(localePath(`/support/${ticket.id}`, locale)); router.refresh();
    } catch (cause) {
      const status = cause instanceof ApiError ? cause.status : 0;
      const code = cause instanceof ApiError ? cause.code : "";
      setExpired(status === 401);
      setError(supportFailureCopy(code, locale) ?? (status === 400 ? c.validation : status === 401 ? c.expired : status === 0 || status >= 500 ? c.network : cause instanceof Error ? cause.message : c.network));
    } finally { busy.current = false; setPending(false); }
  }}>
    <div className="space-y-2"><label htmlFor="ticket-category" className="block font-medium">{c.category}</label>
      <select disabled={pending} id="ticket-category" name="category" required className={supportFieldClass}>
        {Object.entries(c.categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    <div className="space-y-2"><label htmlFor="ticket-subject" className="block font-medium">{c.subject}</label>
      <Input disabled={pending} id="ticket-subject" name="subject" required minLength={5} maxLength={160} dir="auto" aria-describedby="subject-help" />
      <p id="subject-help" className="text-sm text-muted-foreground">{c.subjectHelp}</p>
    </div>
    <div className="space-y-2"><label htmlFor="ticket-body" className="block font-medium">{c.message}</label>
      <textarea disabled={pending} id="ticket-body" name="body" required minLength={20} maxLength={10000} rows={7} dir="auto" className={supportFieldClass} aria-describedby="message-help message-limit" />
      <p id="message-limit" className="text-sm text-muted-foreground">{c.messageHelp}</p>
      <p id="message-help" className="max-w-prose text-sm leading-6 text-muted-foreground">{c.help}</p>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error} {expired && <Link className="underline" href={`${localePath("/account", locale)}?next=${encodeURIComponent(localePath("/support/new", locale))}`}>{c.signIn}</Link>}</p>}
    <ScreenshotPicker locale={locale} files={screenshots} onChange={setScreenshots} disabled={pending} />
    <Button type="submit" disabled={pending}>{pending ? c.sending : c.send}</Button>
  </form>;
}
