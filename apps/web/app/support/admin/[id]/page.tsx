import { notFound } from "next/navigation";
import { getLocale } from "@/lib/serverLocale";
import { ApiError } from "@/lib/api";
import type { SupportThread } from "@/lib/support-api";
import { supportRead } from "@/features/support/support-server";
import { TicketThread } from "@/features/support/ticket-thread";

export default async function AdminTicketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { id } = await params;
  const { page = "1" } = await searchParams;
  let ticket: SupportThread;
  try { ticket = await supportRead<SupportThread>(`/admin/tickets/${encodeURIComponent(id)}?page=${encodeURIComponent(page)}`); }
  catch (cause) { if (cause instanceof ApiError && (cause.status === 403 || cause.status === 404)) notFound(); throw cause; }
  return <TicketThread ticket={ticket} locale={await getLocale()} admin />;
}
