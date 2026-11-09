import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n";
import type { SupportList } from "@/lib/support-api";
import { supportCopy } from "./support-copy";

export function TicketList({ result, locale, admin = false, status }: { result: SupportList; locale: Locale; admin?: boolean; status?: string }) {
  const c = supportCopy[locale];
  const pageLink = (page: number) => `?${new URLSearchParams({ page: String(page), ...(status ? { status } : {}) })}`;
  return <>
    {!result.tickets.length ? <p className="rounded-card border border-border bg-surface p-6 leading-7">{admin ? c.emptyInbox : c.empty}</p> :
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {result.tickets.map((ticket) => <li key={ticket.id}><Link href={localePath(`/support${admin ? "/admin" : ""}/${ticket.id}`, locale)} className="block rounded-control p-5 hover:bg-muted">
          <span className="block break-words font-semibold" dir="auto">{ticket.subject}</span>
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span>{c.categories[ticket.category]}</span><span>{admin && ticket.status === "WAITING_FOR_MEMBER" ? c.staffWaiting : c.statuses[ticket.status]}</span><time dateTime={ticket.updatedAt}>{new Date(ticket.updatedAt).toLocaleDateString(locale)}</time></span>
        </Link></li>)}
      </ul>}
    <nav className="mt-6 flex gap-6" aria-label={admin ? c.inbox : c.tickets}>
      {result.page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={pageLink(result.page - 1)}>{c.previous}</Link>}
      {result.hasMore && <Link className="inline-flex min-h-11 items-center underline" href={pageLink(result.page + 1)}>{c.next}</Link>}
    </nav>
  </>;
}
