/**
 * Typed API client for the blog backend.
 *
 * - `apiFetch` is the low-level helper used by all typed methods.
 * - Public read methods are safe to call from server components.
 * - Write methods are used by the admin dashboard.
 *
 * Server components use API_URL, while browser code uses NEXT_PUBLIC_API_URL.
 * Both default to the local backend during development.
 */

import type {
  ArticleDetailResponse,
  ArticleSummary,
  ArticleInput,
  ArticleListParams,
  ArticleListResponse,
  AuthorListResponse,
  CategoryInput,
  CategoryListResponse,
  MediaAsset,
  MarkdownResource,
  Tag,
  Series,
  ArticleRevision,
  Comment,
  ReaderSession,
  ReaderProfile,
  ReaderLibrary,
  Edition,
  EditionInput,
} from "./types";

const API_URL = typeof window === "undefined"
  ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001"
  : process.env.NEXT_PUBLIC_API_URL ?? "/backend";

export class ApiClientError extends Error {
  status: number;
  details?: { path: string; message: string }[];

  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? "no-store",
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    let details: { path: string; message: string }[] | undefined;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
      details = body?.error?.details;
    } catch {
      // Non-JSON error body; keep the default message.
    }
    throw new ApiClientError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  async listArticles(params: ArticleListParams = {}, options: { cookie?: string } = {}): Promise<ArticleListResponse> {
    const qs = toQuery({
      page: params.page,
      limit: params.limit,
      category: params.category,
      tag: params.tag,
      series: params.series,
      search: params.search,
      published: params.published,
      sort: params.sort,
    });
    return apiFetch<ArticleListResponse>(`/api/articles${qs}`, {
      headers: options.cookie ? { Cookie: options.cookie } : undefined,
    });
  },

  async listAllArticles(options: { cookie?: string } = {}): Promise<{ data: ArticleSummary[] }> {
    const data: ArticleSummary[] = [];
    let page = 1;
    do {
      const response = await this.listArticles({ page, limit: 200 }, options);
      data.push(...response.data);
      if (!response.meta.hasNextPage) break;
      page += 1;
    } while (page <= 1000);
    return { data };
  },

  async getArticle(slug: string, options: { admin?: boolean; cookie?: string } = {}): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(slug)}`, {
      headers: options.cookie ? { Cookie: options.cookie } : undefined,
    });
  },

  async getArticleById(id: string, options: { cookie?: string } = {}): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>(`/api/articles/id/${encodeURIComponent(id)}`, {
      headers: options.cookie ? { Cookie: options.cookie } : undefined,
    });
  },

  async getArticlePreview(token: string, options: { cookie?: string } = {}): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>(`/api/articles/preview/${encodeURIComponent(token)}`, {
      headers: options.cookie ? { Cookie: options.cookie } : undefined,
    });
  },

  async listPopularSearches(): Promise<{ data: { query: string; count: number }[] }> {
    return apiFetch<{ data: { query: string; count: number }[] }>("/api/articles/search/popular");
  },

  async createArticle(input: ArticleInput): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>("/api/articles", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateArticle(id: string, input: Partial<ArticleInput>): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteArticle(id: string): Promise<void> {
    return apiFetch<void>(`/api/articles/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async listArticleRevisions(id: string, options: { cookie?: string } = {}): Promise<{ data: ArticleRevision[] }> {
    return apiFetch<{ data: ArticleRevision[] }>(`/api/articles/${encodeURIComponent(id)}/revisions`, { headers: options.cookie ? { Cookie: options.cookie } : undefined });
  },

  async restoreArticleRevision(id: string, revisionId: string): Promise<ArticleDetailResponse> {
    return apiFetch<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revisionId)}/restore`, { method: "POST" });
  },

  async listCategories(): Promise<CategoryListResponse> {
    return apiFetch<CategoryListResponse>("/api/categories");
  },

  async createCategory(input: CategoryInput): Promise<{ data: { id: string } }> {
    return apiFetch<{ data: { id: string } }>("/api/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCategory(id: string, input: Partial<CategoryInput>): Promise<{ data: { id: string } }> {
    return apiFetch<{ data: { id: string } }>(`/api/categories/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return apiFetch<void>(`/api/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async listAuthors(): Promise<AuthorListResponse> {
    return apiFetch<AuthorListResponse>("/api/authors");
  },

  async listTags(): Promise<{ data: Tag[] }> {
    return apiFetch<{ data: Tag[] }>("/api/tags");
  },

  async createTag(input: { name: string; slug: string; description?: string | null }): Promise<{ data: Tag }> {
    return apiFetch<{ data: Tag }>("/api/tags", { method: "POST", body: JSON.stringify(input) });
  },

  async deleteTag(id: string): Promise<void> {
    return apiFetch<void>(`/api/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async listSeries(): Promise<{ data: Series[] }> {
    return apiFetch<{ data: Series[] }>("/api/series");
  },

  async createSeries(input: { name: string; slug: string; description?: string | null }): Promise<{ data: Series }> {
    return apiFetch<{ data: Series }>("/api/series", { method: "POST", body: JSON.stringify(input) });
  },

  async deleteSeries(id: string): Promise<void> {
    return apiFetch<void>(`/api/series/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async getSeries(slug: string): Promise<{ data: Series & { articles: ArticleSummary[] } }> {
    return apiFetch<{ data: Series & { articles: ArticleSummary[] } }>(`/api/series/${encodeURIComponent(slug)}`);
  },

  async listMedia(options: { cookie?: string } = {}): Promise<{ data: MediaAsset[] }> {
    return apiFetch<{ data: MediaAsset[] }>("/api/media", { headers: options.cookie ? { Cookie: options.cookie } : undefined });
  },

  async uploadMedia(file: File, altText: string, options: { width?: number; height?: number } = {}): Promise<{ data: MediaAsset }> {
    const body = new FormData();
    body.set("file", file);
    body.set("altText", altText);
    if (options.width) body.set("width", String(options.width));
    if (options.height) body.set("height", String(options.height));
    return apiFetch<{ data: MediaAsset }>("/api/media", { method: "POST", body });
  },

  async deleteMedia(id: string): Promise<void> {
    return apiFetch<void>(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async listResources(options: { admin?: boolean; cookie?: string } = {}): Promise<{ data: MarkdownResource[] }> {
    return apiFetch<{ data: MarkdownResource[] }>(`/api/resources${options.admin ? "/admin" : ""}`, { headers: options.cookie ? { Cookie: options.cookie } : undefined });
  },

  async getResource(slug: string): Promise<{ data: MarkdownResource & { content: string } }> {
    return apiFetch<{ data: MarkdownResource & { content: string } }>(`/api/resources/${encodeURIComponent(slug)}`);
  },

  async uploadResource(file: File, metadata: { title: string; slug: string; description: string; category: string; published: boolean }): Promise<{ data: MarkdownResource }> {
    const body = new FormData(); body.set("file", file);
    for (const [key, value] of Object.entries(metadata)) body.set(key, String(value));
    return apiFetch<{ data: MarkdownResource }>("/api/resources/admin", { method: "POST", body });
  },

  async updateResource(id: string, input: Partial<Pick<MarkdownResource, "title" | "slug" | "description" | "category" | "published">>): Promise<{ data: MarkdownResource }> {
    return apiFetch<{ data: MarkdownResource }>(`/api/resources/admin/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
  },

  async deleteResource(id: string): Promise<void> {
    return apiFetch<void>(`/api/resources/admin/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async listEditions(options: { admin?: boolean; cookie?: string } = {}): Promise<{ data: Edition[] }> {
    return apiFetch<{ data: Edition[] }>(`/api/editions${options.admin ? "/admin" : ""}`, { headers: options.cookie ? { Cookie: options.cookie } : undefined });
  },

  async getCurrentEdition(): Promise<{ data: Edition | null }> {
    return apiFetch<{ data: Edition | null }>("/api/editions/current");
  },

  async getEdition(slug: string): Promise<{ data: Edition }> {
    return apiFetch<{ data: Edition }>(`/api/editions/${encodeURIComponent(slug)}`);
  },

  async createEdition(input: EditionInput): Promise<{ data: Edition }> {
    return apiFetch<{ data: Edition }>("/api/editions/admin", { method: "POST", body: JSON.stringify(input) });
  },

  async updateEdition(id: string, input: Partial<EditionInput>): Promise<{ data: Edition }> {
    return apiFetch<{ data: Edition }>(`/api/editions/admin/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
  },

  async deleteEdition(id: string): Promise<void> {
    return apiFetch<void>(`/api/editions/admin/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async listComments(article: string): Promise<{ data: Comment[] }> {
    return apiFetch<{ data: Comment[] }>(`/api/comments?article=${encodeURIComponent(article)}`);
  },

  async submitComment(slug: string, input: { name: string; email: string; body: string; website?: string }): Promise<{ data: { submitted: boolean; message: string } }> {
    return apiFetch<{ data: { submitted: boolean; message: string } }>(`/api/articles/${encodeURIComponent(slug)}/comments`, { method: "POST", body: JSON.stringify(input) });
  },

  async listAdminComments(options: { cookie?: string } = {}): Promise<{ data: (Comment & { email: string; approved: boolean; article: { title: string; slug: string } })[] }> {
    return apiFetch<{ data: (Comment & { email: string; approved: boolean; article: { title: string; slug: string } })[] }>("/api/comments/admin", { headers: options.cookie ? { Cookie: options.cookie } : undefined });
  },

  async approveComment(id: string): Promise<void> {
    await apiFetch(`/api/comments/${encodeURIComponent(id)}/approve`, { method: "PUT" });
  },

  async deleteComment(id: string): Promise<void> {
    return apiFetch<void>(`/api/comments/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async subscribeToNewsletter(email: string): Promise<{ data: { submitted: true } }> {
    return apiFetch<{ data: { submitted: true } }>("/api/newsletter/subscribers", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async loginAdmin(email: string, password: string): Promise<{ data: { authenticated: boolean; user: { email: string } } }> {
    return apiFetch<{ data: { authenticated: boolean; user: { email: string } } }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logoutAdmin(): Promise<void> {
    return apiFetch<void>("/api/admin/logout", { method: "POST" });
  },

  async loginReader(email: string, password: string): Promise<{ data: ReaderSession }> {
    return apiFetch<{ data: ReaderSession }>("/api/readers/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },

  async loginReaderWithGoogle(credential: string): Promise<{ data: ReaderSession }> {
    return apiFetch<{ data: ReaderSession }>("/api/readers/google", { method: "POST", body: JSON.stringify({ credential }) });
  },

  async getReaderSession(): Promise<{ data: ReaderSession }> {
    return apiFetch<{ data: ReaderSession }>("/api/readers/session");
  },

  async getReaderProfile(): Promise<{ data: ReaderProfile }> {
    return apiFetch<{ data: ReaderProfile }>("/api/readers/profile");
  },

  async changeReaderPassword(currentPassword: string | undefined, newPassword: string): Promise<void> {
    await apiFetch("/api/readers/profile/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: currentPassword || undefined, newPassword }),
    });
  },

  async logoutReader(): Promise<void> {
    return apiFetch<void>("/api/readers/logout", { method: "POST" });
  },

  async getReaderLibrary(): Promise<{ data: ReaderLibrary }> {
    return apiFetch<{ data: ReaderLibrary }>("/api/readers/library");
  },

  async syncReaderLibrary(bookmarks: { slug: string; progress: number; visitedAt: string }[], history: { slug: string; progress: number; visitedAt: string }[]): Promise<void> {
    await apiFetch("/api/readers/library/sync", { method: "POST", body: JSON.stringify({ bookmarks, history }) });
  },

  async setReaderBookmark(slug: string, bookmarked: boolean): Promise<void> {
    await apiFetch(`/api/readers/articles/${encodeURIComponent(slug)}/bookmark`, { method: bookmarked ? "PUT" : "DELETE" });
  },

  async saveReaderProgress(slug: string, percentage: number): Promise<void> {
    await apiFetch(`/api/readers/articles/${encodeURIComponent(slug)}/progress`, { method: "PUT", body: JSON.stringify({ percentage }) });
  },
};
