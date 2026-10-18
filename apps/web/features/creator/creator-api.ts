import { request } from "@/lib/api";

export type CreatorListingAction = "SUBMIT" | "WITHDRAW" | "ARCHIVE" | "RESTORE";

export async function transitionCreatorListing(id: string, expectedVersion: number, action: CreatorListingAction) {
  return (await request<{ data: { state: string; version: number; published: boolean } }>(
    `/api/marketplace/creator/products/${encodeURIComponent(id)}/lifecycle`,
    { method: "POST", body: JSON.stringify({ action, expectedVersion }) },
  )).data;
}
