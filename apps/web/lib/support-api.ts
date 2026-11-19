import { request } from "./api";

export type SupportCategory = "TECHNICAL" | "LISTING" | "GENERAL";
export type SupportStatus = "WAITING_FOR_SUPPORT" | "WAITING_FOR_MEMBER" | "RESOLVED";
export type SupportTicket = {
  id: string; subject: string; category: SupportCategory; status: SupportStatus;
  version: number; createdAt: string; updatedAt: string; isOwner: boolean; requester: string;
};
export type SupportMessage = {
  id: string; body: string; kind: "MESSAGE" | "RESOLVED" | "REOPENED"; createdAt: string;
  isSelf: boolean; role: "member" | "support"; name: string; deleted: boolean;
};
export type SupportList = {
  tickets: (SupportTicket & { preview: string })[];
  counts: Record<SupportStatus | "all", number>; page: number; pageSize: number; total: number;
};
export type SupportConversation = { ticket: SupportTicket; messages: SupportMessage[]; earlierCursor: string | null };
const path = (inbox: boolean, id?: string) => `/api/support${inbox ? "/inbox" : ""}${id ? `/${encodeURIComponent(id)}` : ""}`;

export async function listSupportTickets(inbox: boolean, query: string, signal?: AbortSignal) {
  return (await request<{ data: SupportList }>(`${path(inbox)}${query ? `?${query}` : ""}`, { signal })).data;
}
export async function getSupportTicket(inbox: boolean, id: string, before?: string, signal?: AbortSignal) {
  return (await request<{ data: SupportConversation }>(`${path(inbox, id)}${before ? `?before=${encodeURIComponent(before)}` : ""}`, { signal })).data;
}
export async function createSupportTicket(input: { category: SupportCategory; subject: string; message: string }) {
  return (await request<{ data: SupportTicket }>(path(false), { method: "POST", body: JSON.stringify(input) })).data;
}
export async function changeSupportTicket(inbox: boolean, id: string, version: number, message?: string) {
  return (await request<{ data: SupportTicket }>(`${path(inbox, id)}/${message === undefined ? "resolve" : "replies"}`, {
    method: "POST", body: JSON.stringify({ version, ...(message !== undefined && { message }) }),
  })).data;
}
