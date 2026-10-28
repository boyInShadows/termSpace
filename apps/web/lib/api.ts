import type { MarketplaceCreatorPageResult, MyReviewState, OwnReview, ReviewInput, CreatorDashboardResult, CreatorReleaseHistory, MarketplaceCommunity, MarketplaceCommunityPageResult, MarketplaceDraftOptions, MarketplaceDraftRecord, MarketplaceHome, MarketplaceInstallation, ProductRelease, MarketplaceItemType, MarketplaceLibraryEntry, MarketplaceProviderConnection, OwnedCreatorProfile, ProductDetail, ProductFilters, ProductPageResult, ReaderProfile } from "./types";

type ApiErrorDetail = { path: string; code?: string; message: string };
type ErrorBody = { error?: { code?: string; message?: string; details?: ApiErrorDetail[]; correlationId?: string } };

const REQUEST_TIMEOUT_MS = 12_000;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: ApiErrorDetail[],
    public correlationId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBase() { return typeof window === "undefined" ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001" : process.env.NEXT_PUBLIC_API_URL ?? "/backend"; }

/**
 * Public, slow-changing reads (catalogue, listing, communities) are identical
 * for every visitor, so the server may reuse them for a short while (AGENTS.md
 * "Caching"). Short on purpose: a suspended listing must stop showing quickly.
 * Never used for anything that varies by session, and never in the browser.
 */
const PUBLIC_REVALIDATE_SECONDS = 30;

export async function request<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T> {
  const { revalidate, ...fetchInit } = init ?? {};
  const cacheable = revalidate !== undefined && typeof window === "undefined";
  const method = (init?.method ?? "GET").toUpperCase();
  const attempts = method === "GET" ? 2 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
    try {
      const response = await fetch(`${apiBase()}${path}`, { ...fetchInit, signal, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers }, ...(cacheable ? { next: { revalidate } } : { cache: init?.cache ?? "no-store" }) });
      if (RETRYABLE_STATUSES.has(response.status) && attempt < attempts) {
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null) as ErrorBody | null;
        throw new ApiError(
          response.status,
          body?.error?.code ?? "API_ERROR",
          body?.error?.message ?? "The request failed",
          body?.error?.details,
          body?.error?.correlationId ?? response.headers.get("x-correlation-id") ?? undefined,
        );
      }
      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      if (error instanceof ApiError) throw error;
      if (attempt < attempts) continue;
      if (timeoutSignal.aborted) throw new ApiError(504, "CLIENT_TIMEOUT", "The request timed out");
      throw new ApiError(0, "NETWORK_ERROR", "The service could not be reached");
    }
  }

  throw new ApiError(0, "NETWORK_ERROR", "The service could not be reached");
}
// A search term is almost never asked twice, so caching it only fills the cache.
const publicRevalidate = (filters: ProductFilters) => (filters.q?.trim() ? undefined : PUBLIC_REVALIDATE_SECONDS);
export async function getMarketplaceHome() { return (await request<{ data: MarketplaceHome }>("/api/marketplace/home", { revalidate: PUBLIC_REVALIDATE_SECONDS })).data; }
export async function getMarketplaceItemTypes() { return (await request<{ data: MarketplaceItemType[] }>("/api/marketplace/item-types", { revalidate: PUBLIC_REVALIDATE_SECONDS })).data; }
export async function getMarketplaceCommunities() { return (await request<{ data: MarketplaceCommunity[] }>("/api/marketplace/communities", { revalidate: PUBLIC_REVALIDATE_SECONDS })).data; }
export async function getMarketplaceCommunity(slug: string, filters: ProductFilters = {}, forward?: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (key !== "community" && value !== undefined && value !== "" && value !== "All" && value !== false) params.set(key, String(value)); });
  return request<MarketplaceCommunityPageResult>(`/api/marketplace/communities/${encodeURIComponent(slug)}?${params}`, { headers: forward, revalidate: publicRevalidate(filters) });
}
export async function getMarketplaceCreator(handle: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "12" });
  return request<MarketplaceCreatorPageResult>(`/api/marketplace/creators/${encodeURIComponent(handle)}?${params}`, { revalidate: PUBLIC_REVALIDATE_SECONDS });
}
export async function getProducts(filters: ProductFilters = {}, signal?: AbortSignal, forward?: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "" && value !== "All" && value !== false) params.set(key, String(value)); });
  return request<ProductPageResult>(`/api/marketplace/products?${params}`, { signal, headers: forward, revalidate: publicRevalidate(filters) });
}
export async function getProduct(slug: string, signal?: AbortSignal) { return (await request<{ data: ProductDetail }>(`/api/marketplace/products/${encodeURIComponent(slug)}`, { signal, revalidate: PUBLIC_REVALIDATE_SECONDS })).data; }
export async function getProductRelease(slug: string, version: string, signal?: AbortSignal) { return (await request<{ data: ProductRelease }>(`/api/marketplace/products/${encodeURIComponent(slug)}/releases/${encodeURIComponent(version)}`, { signal })).data; }
export type MarketplaceRole = "creator" | "moderator" | "administrator";
export type ReaderSession = { authenticated: true; user: { id: string; email: string; emailVerified: boolean; marketplaceRoles: MarketplaceRole[] } } | { authenticated: false };
export async function getSession(init?: RequestInit) { return request<{ data: ReaderSession }>("/api/readers/session", init); }
export async function login(email: string, password: string) { return request("/api/readers/login", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function loginWithGoogle(credential: string) { return request("/api/readers/google", { method: "POST", body: JSON.stringify({ credential }) }); }
export async function register(email: string, password: string) { return request<{ data: { accepted: true } }>("/api/readers/register", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function requestPasswordReset(email: string) { return request<{ data: { accepted: true } }>("/api/readers/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); }
export async function confirmPasswordReset(email: string, code: string, newPassword: string) { return request<{ data: { reset: true } }>("/api/readers/password-reset/confirm", { method: "POST", body: JSON.stringify({ email, code, newPassword }) }); }
export async function logout() { return request("/api/readers/logout", { method: "POST" }); }
export async function exportAccountData() { return (await request<{ data: unknown }>("/api/readers/profile/export")).data; }
export async function deleteAccount(proof: { currentPassword?: string; credential?: string }) { return request("/api/readers/profile", { method: "DELETE", body: JSON.stringify(proof) }); }
export async function getReaderProfile(signal?: AbortSignal) { return (await request<{ data: ReaderProfile }>("/api/readers/profile", { signal })).data; }
export async function changeReaderPassword(currentPassword: string, newPassword: string) { return request<{ data: { updated: true } }>("/api/readers/profile/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }); }
export async function requestEmailVerification() { return request<{ data: { accepted: true } }>("/api/readers/email-verification/request", { method: "POST" }); }
export async function confirmEmailVerification(token: string) { return request<{ data: { verified: true } }>("/api/readers/email-verification/confirm", { method: "POST", body: JSON.stringify({ token }) }); }
export async function getOwnedCreatorProfile(init?: RequestInit) { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile", init)).data; }
export async function createOwnedCreatorProfile(input: { name: string; handle: string; bio: string }) { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile", { method: "POST", body: JSON.stringify(input) })).data; }
export async function updateOwnedCreatorProfile(input: { name: string; bio: string }) { return (await request<{ data: OwnedCreatorProfile }>("/api/marketplace/creator/profile", { method: "PATCH", body: JSON.stringify(input) })).data; }
export async function getCreatorDashboard(page = 1, limit = 24, signal?: AbortSignal, headers?: HeadersInit) { return request<CreatorDashboardResult>(`/api/marketplace/creator/dashboard?page=${page}&limit=${limit}`, { signal, headers }); }
export async function getMarketplaceDraftOptions() { return (await request<{ data: MarketplaceDraftOptions }>("/api/marketplace/draft-options")).data; }
export async function getCreatorDraft(id: string) { return (await request<{ data: MarketplaceDraftRecord }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/draft`)).data; }
export async function getCreatorReleases(id: string, signal?: AbortSignal) { return (await request<{ data: CreatorReleaseHistory }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/releases`, { signal })).data; }
export async function getProviderConnections(signal?: AbortSignal) { return (await request<{ data: MarketplaceProviderConnection[] }>("/api/marketplace/creator/provider-connections", { signal })).data; }
export async function connectProvider(provider: "github" | "npm", token: string) { return (await request<{ data: MarketplaceProviderConnection }>(`/api/marketplace/creator/provider-connections/${provider}`, { method: "PUT", body: JSON.stringify({ token }) })).data; }
export async function revokeProvider(provider: "github" | "npm") { return request(`/api/marketplace/creator/provider-connections/${provider}`, { method: "DELETE" }); }
export async function requestSourceCheck(id: string, expectedVersion: number) { return (await request<{ data: { id: string; status: string; correlationId: string } }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/source-check`, { method: "POST", body: JSON.stringify({ expectedVersion }) })).data; }
export async function createCreatorDraft(manifest: unknown) { return (await request<{ data: MarketplaceDraftRecord }>("/api/marketplace/creator/products", { method: "POST", body: JSON.stringify({ manifest }) })).data; }
export async function updateCreatorDraft(id: string, expectedVersion: number, manifest: unknown) { return (await request<{ data: MarketplaceDraftRecord }>(`/api/marketplace/creator/products/${encodeURIComponent(id)}/draft`, { method: "PUT", body: JSON.stringify({ expectedVersion, manifest }) })).data; }
export async function getFavorites(signal?: AbortSignal) { return (await request<{ data: string[] }>("/api/marketplace/favorites", { signal })).data; }
export async function getMarketplaceLibrary(page = 1, limit = 24, signal?: AbortSignal) { return request<{ data: MarketplaceLibraryEntry[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/api/marketplace/library?page=${page}&limit=${limit}`, { signal }); }
export async function setFavorite(slug: string, saved: boolean) { return request(`/api/marketplace/products/${encodeURIComponent(slug)}/favorite`, { method: saved ? "PUT" : "DELETE" }); }
export async function acquireProduct(slug: string, idempotencyKey: string, version?: string) { return request<{ data: { id: string; status: string; releaseManifestId: string | null; acquiredAt: string } }>(`/api/marketplace/products/${encodeURIComponent(slug)}/acquire`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, ...(version ? { body: JSON.stringify({ version }) } : {}) }); }
export async function getProductInstallation(slug: string, signal?: AbortSignal) { return (await request<{ data: MarketplaceInstallation }>(`/api/marketplace/products/${encodeURIComponent(slug)}/installation`, { signal })).data; }
const reviewsPath = (slug: string) => `/api/marketplace/products/${encodeURIComponent(slug)}/reviews`;
export async function getMyReview(slug: string, signal?: AbortSignal) { return (await request<{ data: MyReviewState }>(`${reviewsPath(slug)}/mine`, { signal })).data; }
export async function saveReview(slug: string, input: ReviewInput) { return (await request<{ data: OwnReview }>(reviewsPath(slug), { method: "PUT", body: JSON.stringify(input) })).data; }
export async function deleteReview(slug: string) { return request<void>(reviewsPath(slug), { method: "DELETE" }); }
export async function listReviewsForModeration(productId: string) { return (await request<{ data: OwnReview[] }>(`/api/marketplace/moderation/products/${encodeURIComponent(productId)}/reviews`)).data; }
export async function setReviewVisibility(reviewId: string, input: { action: "hide" | "restore"; reason?: string }) { return (await request<{ data: { id: string; hidden: OwnReview["hidden"] } }>(`/api/marketplace/moderation/reviews/${encodeURIComponent(reviewId)}/visibility`, { method: "POST", body: JSON.stringify(input) })).data; }
export async function subscribe(email: string) { return request("/api/newsletter/subscribers", { method: "POST", body: JSON.stringify({ email }) }); }
