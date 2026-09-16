import type { CreatorDashboardResult, MarketplaceDraftOptions, MarketplaceDraftRecord, MarketplaceHome, MarketplaceItemType, OwnedCreatorProfile, ProductDetail, ProductFilters, ProductPageResult } from "./types";
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
function apiBase() { return typeof window === "undefined" ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001" : process.env.NEXT_PUBLIC_API_URL ?? "/backend"; }
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers }, cache: init?.cache ?? "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(response.status, body?.error?.code ?? "API_ERROR", body?.error?.message ?? "The request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function getMarketplaceHome() { return (await request<{ data: MarketplaceHome }>("/api/marketplace/home")).data; }
export async function getMarketplaceItemTypes() { return (await request<{ data: MarketplaceItemType[] }>("/api/marketplace/item-types")).data; }
export async function getProducts(filters: ProductFilters = {}, signal?: AbortSignal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "" && value !== "All" && value !== false) params.set(key, String(value)); });
  return request<ProductPageResult>(`/api/marketplace/products?${params}`, { signal });
}
export async function getProduct(slug: string) { return (await request<{ data: ProductDetail }>(`/api/marketplace/products/${encodeURIComponent(slug)}`)).data; }
export type MarketplaceRole = "creator" | "moderator" | "administrator";
export async function getSession() { return request<{ data: { authenticated: true; user: { id: string; email: string; emailVerified: boolean; marketplaceRoles: MarketplaceRole[] } } }>("/api/readers/session"); }
export async function login(email: string, password: string) { return request("/api/readers/login", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function register(email: string, password: string) { return request("/api/readers/register", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function logout() { return request("/api/readers/logout", { method: "POST" }); }
export async function requestEmailVerification() { return request<{ data: { accepted: true } }>("/api/readers/email-verification/request", { method: "POST" }); }
export async function confirmEmailVerification(token: string) { return request<{ data: { verified: true } }>("/api/readers/email-verification/confirm", { method: "POST", body: JSON.stringify({ token }) }); }
export async function getOwnedCreatorProfile() { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile")).data; }
export async function createCreatorProfile(input: { name: string; handle: string; bio: string }) { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile", { method: "POST", body: JSON.stringify(input) })).data; }
export async function updateCreatorProfile(input: { name: string; bio: string }) { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile", { method: "PATCH", body: JSON.stringify(input) })).data; }
export async function getCreatorDashboard(page = 1, limit = 24, signal?: AbortSignal) { return request<CreatorDashboardResult>(`/api/marketplace/creator/dashboard?page=${page}&limit=${limit}`, { signal }); }
export async function getMarketplaceDraftOptions() { return (await request<{ data: MarketplaceDraftOptions }>("/api/marketplace/draft-options")).data; }
export async function getCreatorDraft(id: string) { return (await request<{ data: MarketplaceDraftRecord }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/draft`)).data; }
export async function createCreatorDraft(manifest: unknown) { return (await request<{ data: MarketplaceDraftRecord }>("/api/marketplace/creator/products", { method: "POST", body: JSON.stringify({ manifest }) })).data; }
export async function updateCreatorDraft(id: string, expectedVersion: number, manifest: unknown) { return (await request<{ data: MarketplaceDraftRecord }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/draft`, { method: "PUT", body: JSON.stringify({ expectedVersion, manifest }) })).data; }
export async function getFavorites() { return (await request<{ data: string[] }>("/api/marketplace/favorites")).data; }
export async function setFavorite(slug: string, saved: boolean) { return request(`/api/marketplace/products/${encodeURIComponent(slug)}/favorite`, { method: saved ? "PUT" : "DELETE" }); }
export async function acquireProduct(slug: string, idempotencyKey: string) { return request(`/api/marketplace/products/${encodeURIComponent(slug)}/acquire`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey } }); }
export async function subscribe(email: string) { return request("/api/newsletter/subscribers", { method: "POST", body: JSON.stringify({ email }) }); }
