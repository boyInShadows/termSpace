import { request } from "./api";

export type SupportCategory = "TECHNICAL" | "LISTING" | "GENERAL";
export type SupportStatus = "WAITING_FOR_SUPPORT" | "WAITING_FOR_MEMBER" | "RESOLVED";
export type SupportTicket = {
  id: string; category: SupportCategory; subject: string; status: SupportStatus; version: number; createdAt: string; updatedAt: string;
};
export type SupportAttachment = { id: string; bytes: number; width: number; height: number };
export type SupportMessage = { id: string; body: string; authorRole: "MEMBER" | "ADMINISTRATOR"; createdAt: string; attachments: SupportAttachment[] };
export type SupportThread = SupportTicket & { messages: SupportMessage[]; hasMore: boolean; page: number };
export type SupportList = { tickets: SupportTicket[]; hasMore: boolean; page: number };

function messageBody(input: object, files: File[]) {
  if (!files.length) return JSON.stringify(input);
  const form = new FormData();
  form.set("payload", JSON.stringify(input));
  for (const file of files) form.append("screenshots", file);
  return form;
}

export async function createSupportTicket(input: { category: SupportCategory; subject: string; body: string }, files: File[] = []) {
  return (await request<{ data: { id: string } }>("/api/support/tickets", { method: "POST", body: messageBody(input, files) })).data;
}

export function replySupportTicket(id: string, input: { body: string; expectedVersion: number }, admin: boolean, files: File[] = []) {
  return request(`/api/support${admin ? "/admin" : ""}/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: messageBody(input, files) });
}
export function resolveSupportTicket(id: string, expectedVersion: number, admin: boolean) {
  return request(`/api/support${admin ? "/admin" : ""}/tickets/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify({ expectedVersion }) });
}
