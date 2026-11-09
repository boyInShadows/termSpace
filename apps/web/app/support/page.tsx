import Link from "next/link";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { TicketList } from "@/features/support/ticket-list";
import type { SupportList } from "@/lib/support-api";
import { supportRead } from "@/features/support/support-server";
import { supportCopy } from "@/features/support/support-copy";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const locale = await getLocale();
  const c = supportCopy[locale];
  const { page = "1" } = await searchParams;
  const result = await supportRead<SupportList>(`/tickets?page=${encodeURIComponent(page)}`);
  return <>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">{c.tickets}</h1><p className="mt-3 max-w-prose leading-7 text-muted-foreground">{c.privacy}</p></div>
      <Link href={localePath("/support/new", locale)} className={buttonVariants()}>{c.newTicket}</Link>
    </div>
    <TicketList result={result} locale={locale} />
  </>;
}
