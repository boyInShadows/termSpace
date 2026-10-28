// Account-only calls live apart from lib/api.ts so the public pages do not ship them.
import { request } from "./api";

export async function requestEmailChange(newEmail: string, currentPassword: string) { return request<{ data: { accepted: true } }>("/api/readers/profile/email", { method: "POST", body: JSON.stringify({ newEmail, currentPassword }) }); }
export async function confirmEmailChange(token: string) { return request<{ data: { changed: true } }>("/api/readers/profile/email/confirm", { method: "POST", body: JSON.stringify({ token }) }); }
export async function revokeOtherSessions() { return (await request<{ data: { revoked: number } }>("/api/readers/sessions/revoke-others", { method: "POST" })).data; }
