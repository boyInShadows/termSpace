// Account-only calls live apart from lib/api.ts so the public pages do not ship them.
import { request } from "./api";
import type { MarketplaceItemTypeKey, MarketplaceLibraryEntry, Product } from "./types";

export async function requestEmailChange(newEmail: string, currentPassword: string) { return request<{ data: { accepted: true } }>("/api/readers/profile/email", { method: "POST", body: JSON.stringify({ newEmail, currentPassword }) }); }
export async function confirmEmailChange(token: string) { return request<{ data: { changed: true } }>("/api/readers/profile/email/confirm", { method: "POST", body: JSON.stringify({ token }) }); }
export async function revokeOtherSessions() { return (await request<{ data: { revoked: number } }>("/api/readers/sessions/revoke-others", { method: "POST" })).data; }
export type LibrarySort = "newest" | "oldest" | "name";
export type LibraryFilters = { q?: string; type?: MarketplaceItemTypeKey; sort?: LibrarySort };
export async function getMarketplaceLibrary(page = 1, limit = 24, signal?: AbortSignal, filters: LibraryFilters = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return request<{ data: MarketplaceLibraryEntry[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/api/marketplace/library?${params}`, { signal });
}
/** One request for a page of saved listings; slugs that are not published come back missing. */
export async function getProductsBySlugs(slugs: string[], signal?: AbortSignal) {
  return (await request<{ data: Product[] }>(`/api/marketplace/products?slugs=${slugs.map(encodeURIComponent).join(",")}&limit=${slugs.length}`, { signal })).data;
}
