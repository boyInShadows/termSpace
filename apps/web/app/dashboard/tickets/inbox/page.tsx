import { Suspense } from "react";
import { TicketList } from "@/features/support/ticket-list";
import { SupportLoading } from "@/features/support/support-ui";

export default function SupportInboxPage() { return <Suspense fallback={<SupportLoading />}><TicketList inbox /></Suspense>; }
