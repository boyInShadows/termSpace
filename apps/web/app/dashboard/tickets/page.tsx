import { Suspense } from "react";
import { TicketList } from "@/features/support/ticket-list";
import { SupportLoading } from "@/features/support/support-ui";

export default function TicketsPage() { return <Suspense fallback={<SupportLoading />}><TicketList /></Suspense>; }
