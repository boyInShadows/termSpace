import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n";
import type { SupportThread } from "@/lib/support-api";
import { supportCopy } from "./support-copy";
import { TicketComposer } from "./ticket-composer";
import { PrivateScreenshot } from "./private-screenshot";

export function TicketThread({ ticket, locale, admin = false }: { ticket: SupportThread; locale: Locale; admin?: boolean }) {
  const c = supportCopy[locale];
  return <>
    <h1 className="break-words text-3xl font-semibold tracking-tight" dir="auto">{ticket.subject}</h1>
    <p className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{c.categories[ticket.category]}</span><span>{admin && ticket.status === "WAITING_FOR_MEMBER" ? c.staffWaiting : c.statuses[ticket.status]}</span></p>
    <ol className="my-8 space-y-6">
      {ticket.messages.map((message) => <li key={message.id} className="rounded-card border border-border bg-surface p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold">{message.authorRole === "MEMBER" ? admin ? c.member : c.you : c.staff}</span><time className="text-muted-foreground" dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(locale)}</time></div>
        <p className="whitespace-pre-wrap break-words leading-7 [overflow-wrap:anywhere]" dir="auto">{message.body}</p>
        {message.attachments.length > 0 && <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {message.attachments.map((attachment, index) => <PrivateScreenshot key={attachment.id} attachment={attachment} number={index + 1} admin={admin} locale={locale} />)}
        </div>}
      </li>)}
    </ol>
    {ticket.page === 1 && <TicketComposer ticket={ticket} admin={admin} />}
    <nav className="flex flex-wrap gap-6" aria-label={c.message}>
      {ticket.hasMore && <Link className="inline-flex min-h-11 items-center underline" href={`?page=${ticket.page + 1}`}>{c.next}</Link>}
      {ticket.page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={`?page=${ticket.page - 1}`}>{c.previous}</Link>}
      <Link className="inline-flex min-h-11 items-center underline" href={localePath(admin ? "/support/admin" : "/support", locale)}>{c.back}</Link>
    </nav>
  </>;
}
