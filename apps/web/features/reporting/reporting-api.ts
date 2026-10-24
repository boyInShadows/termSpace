import { request } from "@/lib/api";
import type { ListingReportReason, ModerationCaseEvent, ModerationCasePage, ModerationCaseReport, ModerationCaseState, ModerationCaseSummary, ModerationCaseTriage } from "@/lib/types";

export async function reportListing(slug: string, input: { reason: ListingReportReason; explanation: string }) {
  return (await request<{ data: { accepted: true; receiptId: string } }>(`/api/marketplace/products/${encodeURIComponent(slug)}/reports`, { method: "POST", body: JSON.stringify(input) })).data;
}
export async function getReportCases(state: ModerationCaseState | undefined, page = 1, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), limit: "24", ...(state ? { state } : {}) });
  return request<ModerationCasePage<ModerationCaseSummary>>(`/api/marketplace/moderation/cases?${query}`, { signal });
}
export async function getReportCase(id: string, signal?: AbortSignal) {
  return (await request<{ data: ModerationCaseSummary & { events: ModerationCaseEvent[] } }>(`/api/marketplace/moderation/cases/${encodeURIComponent(id)}`, { signal })).data;
}
export async function getCaseReports(id: string, page = 1, signal?: AbortSignal) {
  return request<ModerationCasePage<ModerationCaseReport>>(`/api/marketplace/moderation/cases/${encodeURIComponent(id)}/reports?page=${page}&limit=12`, { signal });
}
export async function getCaseEvents(id: string, page = 1, signal?: AbortSignal) {
  return request<ModerationCasePage<ModerationCaseEvent>>(`/api/marketplace/moderation/cases/${encodeURIComponent(id)}/events?page=${page}&limit=12`, { signal });
}
export async function triageReportCase(id: string, input: ModerationCaseTriage) {
  return (await request<{ data: Pick<ModerationCaseSummary, "id" | "state" | "severity" | "version"> & { correlationId: string } }>(`/api/marketplace/moderation/cases/${encodeURIComponent(id)}/triage`, { method: "POST", body: JSON.stringify(input) })).data;
}
