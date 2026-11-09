// Dashboard-only calls, kept out of lib/account-api so public routes that use
// the account client do not pay for the notification feed.
import { request } from "./api";

export type ModerationNotification = {
  id: string;
  type: "approved" | "changes_requested" | "rejected";
  productName: string;
  productSlug: string;
  publicReason: string | null;
  readAt: string | null;
  createdAt: string;
};

export type SupportNotification = {
  id: string;
  type: "support_created" | "support_message" | "support_reply" | "support_resolved";
  ticketId: string;
  staff: boolean;
  readAt: string | null;
  createdAt: string;
};
export type MarketplaceNotification = ModerationNotification | SupportNotification;

export async function getMarketplaceNotifications(signal?: AbortSignal) {
  return (await request<{ data: { unread: number; notifications: MarketplaceNotification[] } }>("/api/marketplace/notifications", { signal })).data;
}

export async function markMarketplaceNotificationsRead(ids?: string[]) {
  return (await request<{ data: { updated: number; unread: number } }>("/api/marketplace/notifications/read", {
    method: "POST",
    body: JSON.stringify(ids === undefined ? {} : { ids }),
  })).data;
}
