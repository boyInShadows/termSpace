import { request } from "./api";

export type SupportCategory = "TECHNICAL" | "LISTING" | "GENERAL";
export type SupportStatus = "WAITING_FOR_SUPPORT" | "WAITING_FOR_MEMBER" | "RESOLVED";
export type SupportTicket = {
  id: string; category: SupportCategory; subject: string; status: SupportStatus; version: number; createdAt: string; updatedAt: string;
};
export type SupportMessage = { id: string; body: string; authorRole: "MEMBER" | "ADMINISTRATOR"; createdAt: string };
export type SupportThread = SupportTicket & { messages: SupportMessage[]; hasMore: boolean; page: number };
export type SupportList = { tickets: SupportTicket[]; hasMore: boolean; page: number };

export async function createSupportTicket(input: { category: SupportCategory; subject: string; body: string }) {
  return (await request<{ data: { id: string } }>("/api/support/tickets", { method: "POST", body: JSON.stringify(input) })).data;
}

export function replySupportTicket(id: string, input: { body: string; expectedVersion: number }, admin: boolean) {
  return request(`/api/support${admin ? "/admin" : ""}/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify(input) });
}
export function resolveSupportTicket(id: string, expectedVersion: number, admin: boolean) {
  return request(`/api/support${admin ? "/admin" : ""}/tickets/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify({ expectedVersion }) });
}
