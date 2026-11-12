"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { changeSupportTicket, getSupportTicket, type SupportConversation } from "@/lib/support-api";
import { supportCopy } from "./support-copy";
import { supportFailure, supportField, supportPanel, SupportError, SupportLoading, SupportSwitch, TicketStatus, TicketTime, useSupportAccess } from "./support-ui";
import { useUnsentWarning } from "./use-unsent-warning";

export function TicketThread({ ticketId, inbox = false }: { ticketId: string; inbox?: boolean }) {
  const { locale } = useLocale(); const copy = supportCopy[locale];
  const staff = useSupportAccess(); const params = useSearchParams();
  const [conversation, setData] = useState<SupportConversation | null>(null);
  const [failure, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState(""); const [completed, setCompleted] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "resolve" | "earlier" | null>(null);
  const pending = useRef(false); const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([ticketId, inbox, retry, staff, locale]);
  const forbidden = inbox && !staff;
  const data = forbidden ? null : conversation;
  const error = forbidden ? copy.access : failure;
  const loading = !forbidden && completed !== requestKey;
  useUnsentWarning(Boolean(draft), copy.leave);
  useEffect(() => {
    const controller = new AbortController();
    if (forbidden) return;
    void getSupportTicket(inbox, ticketId, undefined, controller.signal)
      .then(next => { if (!controller.signal.aborted) { setData(next); setError(null); } })
      .catch(cause => { if (!controller.signal.aborted) { setData(null); setError(supportFailure(cause, copy)); } })
      .finally(() => { if (!controller.signal.aborted) setCompleted(requestKey); });
    return () => controller.abort();
  }, [ticketId, inbox, requestKey, forbidden, copy]);
  async function mutate(resolve: boolean) {
    if (!data || pending.current) return;
    if (!resolve && (!draft.trim() || draft.trim().length > 5000)) { setNotice(copy.invalid); return; }
    pending.current = true; setBusy(resolve ? "resolve" : "send"); setNotice(null);
    let saved = false;
    try {
      await changeSupportTicket(inbox, ticketId, data.ticket.version, resolve ? undefined : draft.trim());
      saved = true;
      if (!resolve) setDraft("");
      setNotice(resolve ? copy.resolvedNotice : copy.sent);
      setData(await getSupportTicket(inbox, ticketId));
    } catch (cause) {
      setNotice(supportFailure(cause, copy, saved ? copy.error : copy.failedSend));
      if (cause instanceof ApiError && cause.status === 409) {
        try { setData(await getSupportTicket(inbox, ticketId)); }
        catch (refreshError) { setData(null); setError(supportFailure(refreshError, copy)); }
      } else if (saved || (cause instanceof ApiError && [401, 403, 404].includes(cause.status))) {
        setData(null); setError(supportFailure(cause, copy));
      }
    } finally { pending.current = false; setBusy(null); }
  }
  async function earlier() {
    if (!data?.earlierCursor || pending.current) return;
    pending.current = true; setBusy("earlier"); setNotice(null);
    const height = document.documentElement.scrollHeight;
    try {
      const older = await getSupportTicket(inbox, ticketId, data.earlierCursor);
      // Keep the reader at the same visible message when earlier history is prepended.
      setData(current => current && ({ ...current, earlierCursor: older.earlierCursor, messages: [...older.messages, ...current.messages] }));
      requestAnimationFrame(() => window.scrollBy({ top: document.documentElement.scrollHeight - height, behavior: "instant" }));
    } catch (cause) {
      setNotice(supportFailure(cause, copy));
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) { setData(null); setError(supportFailure(cause, copy)); }
    } finally { pending.current = false; setBusy(null); }
  }
  const back = localePath(`/dashboard/tickets${inbox ? "/inbox" : ""}`, locale);
  const resolved = data?.ticket.status === "RESOLVED";
  return <section className="mx-auto max-w-3xl" aria-labelledby="ticket-heading">
    <SupportSwitch inbox={inbox} />
    <Link href={back} className={`${buttonVariants({ variant: "ghost" })} mb-4`}>{copy.back}</Link>
    <div role="status" aria-live="polite" className={notice || params.get("created") ? "mb-4 text-sm leading-relaxed text-foreground" : "sr-only"}>{notice ?? (params.get("created") === "1" ? copy.created : "")}</div>
    {loading ? <SupportLoading /> : error ? <SupportError message={error} retry={() => setRetry(value => value + 1)} /> : data && <>
      <header className="mb-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><h1 id="ticket-heading" dir="auto" className="min-w-0 flex-1 basis-64 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{data.ticket.subject}</h1>
          {!resolved && <Button variant="secondary" disabled={Boolean(busy)} onClick={() => void mutate(true)}>{busy === "resolve" ? copy.resolving : copy.resolve}</Button>}</div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="font-mono" dir="ltr">#{data.ticket.id}</span><span>{copy.categories[data.ticket.category]}</span><TicketStatus status={data.ticket.status} inbox={inbox && !data.ticket.isOwner} />
          {inbox && <span>{copy.requester}: <bdi>{data.ticket.requester === "Member" ? copy.member : data.ticket.requester}</bdi></span>}
        </div>
      </header>
      {resolved && <div className={`${supportPanel} mb-6 text-sm leading-relaxed`}><p className="font-semibold">{copy.resolved}</p><p className="mt-1 text-muted-foreground">{data.ticket.isOwner ? copy.reopenHint : copy.staffResolved}</p></div>}
      {data.earlierCursor && <Button variant="secondary" className="mb-5" disabled={Boolean(busy)} onClick={() => void earlier()}>{busy === "earlier" ? copy.loadingEarlier : copy.earlier}</Button>}
      <ol className="space-y-4" aria-label={copy.message}>{data.messages.map(message => <li key={message.id}>
        {message.kind !== "MESSAGE" && <p className="mb-3 text-center text-xs leading-relaxed text-muted-foreground"><bdi>{message.deleted ? copy.deleted : message.name === "Member" ? copy.member : message.name === "Support" ? copy.support : message.name}</bdi> {message.kind === "RESOLVED" ? copy.resolvedEvent : copy.reopenedEvent} · <TicketTime value={message.createdAt} /></p>}
        {message.kind !== "RESOLVED" && <article className={`${supportPanel} ${message.role === "support" ? "border-border-strong" : ""}`}>
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p><bdi className="font-semibold text-foreground">{message.deleted ? copy.deleted : message.name === "Member" ? copy.member : message.name === "Support" ? copy.support : message.name}</bdi><span className="ms-2">{message.role === "support" ? copy.support : copy.member}</span></p>
            <TicketTime value={message.createdAt} />
          </header><p dir="auto" className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{message.deleted ? copy.removed : message.body}</p>
        </article>}
      </li>)}</ol>
    </>}
    {!loading && ((data && (!resolved || data.ticket.isOwner)) || draft) && <form className={`${supportPanel} mt-7 space-y-3`} aria-busy={busy === "send"} onSubmit={event => { event.preventDefault(); void mutate(false); }}>
      <label htmlFor="support-reply" className="text-sm font-medium">{copy.reply}</label>
      <textarea id="support-reply" value={draft} onChange={event => setDraft(event.target.value)} disabled={Boolean(busy) || !data || (resolved && !data.ticket.isOwner)} required maxLength={5000} dir="auto" aria-describedby="reply-help" className={`${supportField} min-h-36 resize-y leading-relaxed`} />
      <p id="reply-help" className="text-xs leading-relaxed text-muted-foreground">{copy.messageHelp}</p>
      <Button type="submit" disabled={Boolean(busy) || !data || !draft.trim() || (resolved && !data.ticket.isOwner)}>{busy === "send" ? copy.sending : resolved ? copy.reopen : copy.send}</Button>
    </form>}
  </section>;
}
