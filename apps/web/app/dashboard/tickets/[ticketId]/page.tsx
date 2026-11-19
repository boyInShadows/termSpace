import { Suspense } from "react";
import { TicketThread } from "@/features/support/ticket-thread";
import { SupportLoading } from "@/features/support/support-ui";

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <Suspense fallback={<SupportLoading />}><TicketThread ticketId={ticketId} /></Suspense>;
}
