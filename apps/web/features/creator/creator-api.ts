import { request } from "@/lib/api";

export async function transitionCreatorListing(id: string, expectedVersion: number) {
  return (await request<{ data: { state: string; version: number } }>(
    `/api/marketplace/creator/products/${encodeURIComponent(id)}/lifecycle`,
    { method: "POST", body: JSON.stringify({ action: "SUBMIT", expectedVersion }) },
  )).data;
}
