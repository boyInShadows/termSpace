"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { replySupportTicket, resolveSupportTicket, type SupportTicket } from "@/lib/support-api";
import { useLocale } from "@/lib/locale-context";
import { supportCopy, supportFailureCopy } from "./support-copy";
import { ScreenshotPicker } from "./screenshot-picker";
import { supportFieldClass } from "./new-ticket-form";

export function TicketComposer({ ticket, admin = false }: { ticket: SupportTicket; admin?: boolean }) {
  const { locale } = useLocale();
  const c = supportCopy[locale];
  const router = useRouter();
  const busy = useRef(false);
  const [body, setBody] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [pending, setPending] = useState<"reply" | "resolve" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "reply" | "resolve") {
    if (busy.current) return;
    busy.current = true; setPending(action); setError(null);
    try {
      if (action === "reply") {
        await replySupportTicket(ticket.id, { body, expectedVersion: ticket.version }, admin, screenshots);
        setBody(""); setScreenshots([]);
      }
      else await resolveSupportTicket(ticket.id, ticket.version, admin);
      router.refresh();
    } catch (cause) {
      const status = cause instanceof ApiError ? cause.status : 0;
      const code = cause instanceof ApiError ? cause.code : "";
      setError(supportFailureCopy(code, locale) ?? (status === 409 ? c.conflict : status === 401 ? c.expired : status === 403 || status === 404 ? c.unavailable : status === 400 ? c.replyHelp : c.network));
      if (status === 409) router.refresh();
    } finally { busy.current = false; setPending(null); }
  }

  return <section className="my-8 space-y-4" aria-label={c.reply}>
    {ticket.status === "RESOLVED" && <p role="status" className="text-sm leading-6 text-muted-foreground">{admin ? c.staffResolved : c.resolved}</p>}
    {!(admin && ticket.status === "RESOLVED") && <form className="space-y-3" aria-busy={pending === "reply"} onSubmit={(event) => { event.preventDefault(); void submit("reply"); }}>
      <label htmlFor="ticket-reply" className="block font-medium">{c.message}</label>
      <textarea disabled={pending !== null} id="ticket-reply" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={10000} rows={5} dir="auto" aria-describedby="reply-help" className={supportFieldClass} />
      <p id="reply-help" className="text-sm leading-6 text-muted-foreground">{c.replyHelp}</p>
      <ScreenshotPicker locale={locale} files={screenshots} onChange={setScreenshots} disabled={pending !== null} />
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={pending !== null}>{pending === "reply" ? c.sending : c.reply}</Button>
        {ticket.status !== "RESOLVED" && <Button type="button" variant="secondary" disabled={pending !== null} onClick={() => void submit("resolve")}>{pending === "resolve" ? c.resolving : c.resolve}</Button>}
      </div>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
