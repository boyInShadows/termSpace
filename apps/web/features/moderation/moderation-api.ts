import { request } from "@/lib/api";
import type { MarketplaceModerationPreview, MarketplaceModerationQueueResult } from "@/lib/types";

export async function getModerationQueue(input: { state?: string; q?: string; page?: number; limit?: number }, signal?: AbortSignal) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return request<MarketplaceModerationQueueResult>(`/api/marketplace/moderation/queue?${params}`, { signal });
}

export async function getModerationPreview(id: string) { return (await request<{ data: MarketplaceModerationPreview }>(`/api/marketplace/moderation/products/${encodeURIComponent(id)}`)).data; }
export async function addModerationNote(id: string, expectedVersion: number, note: string) { return (await request<{ data: { id: string; createdAt: string; correlationId: string } }>(`/api/marketplace/moderation/products/${encodeURIComponent(id)}/notes`, { method: "POST", body: JSON.stringify({ expectedVersion, note }) })).data; }
export async function moderateCommunityPlacement(id: string, communitySlug: string, input: { expectedVersion: number; action: "APPROVE" | "REJECT" | "REMOVE"; publicReason?: string; internalNote?: string }) { return (await request<{ data: { id: string; state: string; version: number; publicReason: string | null; decidedAt: string; correlationId: string } }>(`/api/marketplace/moderation/products/${encodeURIComponent(id)}/community-placements/${encodeURIComponent(communitySlug)}`, { method: "POST", body: JSON.stringify(input) })).data; }
export async function moderateListing(id: string, input: { action: string; expectedVersion: number; reasonCode?: string; publicReason?: string; internalNote?: string }) { return (await request<{ data: { id: string; state: string; version: number; published: boolean; correlationId: string } }>(`/api/marketplace/moderation/products/${encodeURIComponent(id)}/lifecycle`, { method: "POST", body: JSON.stringify(input) })).data; }
