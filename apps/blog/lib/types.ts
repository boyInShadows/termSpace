/**
 * Shared types mirroring the backend API response shapes.
 * These are used across server components, client components, and the admin.
 */

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  _count?: { articles: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export interface Series {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  heroImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  seriesOrder: number | null;
  series: Pick<Series, "id" | "name" | "slug"> | null;
  tags: Pick<Tag, "id" | "name" | "slug">[];
  readingMinutes?: number;
  author: Pick<Author, "id" | "name" | "avatarUrl">;
  category: Pick<Category, "id" | "name" | "slug">;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  previewToken?: string | null;
  author: Pick<Author, "id" | "name" | "bio" | "avatarUrl">;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ArticleListResponse {
  data: ArticleSummary[];
  meta: PaginationMeta;
}

export interface ArticleDetailResponse {
  data: ArticleDetail;
}

export interface CategoryListResponse {
  data: Category[];
}

export interface AuthorListResponse {
  data: Author[];
}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  series?: string;
  search?: string;
  published?: boolean;
  sort?: "newest" | "oldest" | "title";
}

export interface ArticleInput {
  expectedUpdatedAt?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  heroImage?: string | null;
  published?: boolean;
  publishedAt?: string | null;
  authorId: string;
  categoryId: string;
  tagIds?: string[];
  seriesId?: string | null;
  seriesOrder?: number | null;
  scheduledAt?: string | null;
}

export interface MediaAsset {
  id: string;
  key: string;
  url: string;
  altText: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface MarkdownResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  fileName: string;
  content?: string;
  size: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Edition {
  id: string;
  number: number;
  title: string;
  slug: string;
  description: string;
  editorialNote: string | null;
  coverImage: string | null;
  accentColor: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  articles: (ArticleSummary & { position: number })[];
}

export interface EditionInput {
  number: number;
  title: string;
  slug: string;
  description: string;
  editorialNote?: string | null;
  coverImage?: string | null;
  accentColor: string;
  published: boolean;
  articleIds: string[];
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface Comment {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

export interface ReaderSession {
  authenticated: true;
  user: {
    id?: string;
    email: string;
    emailVerified?: boolean;
    marketplaceRoles?: ("creator" | "moderator" | "administrator")[];
  };
}

export interface ReaderProfile {
  email: string;
  createdAt: string;
  hasPassword: boolean;
  connectedGoogle: boolean;
  emailVerified: boolean;
}

export interface ReaderLibraryArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  publishedAt: string | null;
}

export interface ReaderLibrary {
  bookmarks: { createdAt: string; article: ReaderLibraryArticle }[];
  history: { percentage: number; visitedAt: string; article: ReaderLibraryArticle }[];
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
}

export interface ApiError {
  error: {
    code?: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
