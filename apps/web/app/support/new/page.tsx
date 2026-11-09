import { getLocale } from "@/lib/serverLocale";
import { supportCopy } from "@/features/support/support-copy";
import { NewTicketForm } from "@/features/support/new-ticket-form";

export default async function NewTicketPage() {
  const c = supportCopy[await getLocale()];
  return <><h1 className="text-3xl font-semibold tracking-tight">{c.newTicket}</h1><p className="mb-8 mt-3 leading-7 text-muted-foreground">{c.privacy}</p><NewTicketForm /></>;
}
