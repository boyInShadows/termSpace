import Link from "next/link";
import { getLocale } from "@/lib/serverLocale";
import type { SupportList } from "@/lib/support-api";
import { supportRead } from "@/features/support/support-server";
import { supportCopy } from "@/features/support/support-copy";
import { TicketList } from "@/features/support/ticket-list";

export default async function SupportInbox({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const locale = await getLocale();
  const c = supportCopy[locale];
  const { page = "1", status = "WAITING_FOR_SUPPORT" } = await searchParams;
  const query = new URLSearchParams({ page, ...(status !== "ALL" ? { status } : {}) });
  const result = await supportRead<SupportList>(`/admin/tickets?${query}`);
  return <>
    <h1 className="text-3xl font-semibold tracking-tight">{c.inbox}</h1>
    <nav className="my-6 flex flex-wrap gap-x-5 gap-y-2" aria-label={c.inbox}>
      {(["WAITING_FOR_SUPPORT", "WAITING_FOR_MEMBER", "RESOLVED", "ALL"] as const).map(value => <Link key={value} href={`?status=${value}`} aria-current={status === value ? "page" : undefined} className="inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline aria-[current=page]:font-semibold aria-[current=page]:underline">{value === "ALL" ? c.all : value === "WAITING_FOR_MEMBER" ? c.staffWaiting : c.statuses[value]}</Link>)}
    </nav>
    <TicketList result={result} locale={locale} admin status={status} />
  </>;
}
