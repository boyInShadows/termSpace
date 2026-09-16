import { z } from "zod";
import { marketplaceManifestV1Schema } from "../lib/marketplaceManifest.js";

/**
 * Validation schemas for request bodies and query parameters.
 * Used by the validate middleware before reaching controllers.
 */

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedImageHosts = new Set(
  (process.env.IMAGE_HOSTS ?? "images.unsplash.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);
const imageUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((value) => {
    const url = new URL(value);
    const localDevelopment = process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    return localDevelopment || (url.protocol === "https:" && allowedImageHosts.has(url.hostname.toLowerCase()));
  }, "Image must use HTTPS and an allowed host");

const articleRelationsSchema = {
  tagIds: z.array(z.string().min(1)).max(20).optional(),
  seriesId: z.string().min(1).optional().nullable(),
  seriesOrder: z.number().int().min(1).max(10_000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
};

export const createArticleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .regex(slugPattern, "Slug must be lowercase with hyphens (e.g. my-post)")
    .max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  heroImage: imageUrlSchema.optional().nullable(),
  published: z.boolean().optional().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  authorId: z.string().min(1, "authorId is required"),
  categoryId: z.string().min(1, "categoryId is required"),
  ...articleRelationsSchema,
});

export const updateArticleSchema = z.object({
  expectedUpdatedAt: z.string().datetime().optional(),
  title: z.string().min(3).max(200).optional(),
  slug: z.string().regex(slugPattern).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10).optional(),
  heroImage: imageUrlSchema.optional().nullable(),
  published: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  authorId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  ...articleRelationsSchema,
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(9),
  category: z.string().optional(),
  tag: z.string().optional(),
  series: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  published: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === undefined ? undefined : value === "true"),
  sort: z
    .enum(["newest", "oldest", "title"])
    .optional()
    .default("newest"),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().regex(slugPattern, "Slug must be lowercase with hyphens").max(100),
  description: z.string().max(300).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().regex(slugPattern).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address").max(320),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(320),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const readerCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(320),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const readerPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128).optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const googleCredentialSchema = z.object({
  credential: z.string().min(100).max(5000),
});

export const emailVerificationConfirmSchema = z.object({
  token: z.string().min(40).max(200).regex(/^[A-Za-z0-9._-]+$/, "Invalid verification token"),
});

const savedArticleSchema = z.object({
  slug: z.string().regex(slugPattern).max(200),
  progress: z.number().int().min(0).max(100).optional().default(0),
  visitedAt: z.string().datetime().optional(),
});

export const readerLibrarySyncSchema = z.object({
  bookmarks: z.array(savedArticleSchema).max(200).default([]),
  history: z.array(savedArticleSchema).max(200).default([]),
});

export const readerProgressSchema = z.object({
  percentage: z.number().int().min(0).max(100),
});

export const marketplaceProductQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  type: z.string().trim().max(40).optional(),
  category: z.string().trim().max(80).optional(),
  platform: z.string().trim().max(40).optional(),
  price: z.enum(["free", "paid"]).optional(),
  verified: z.enum(["true", "false"]).optional().transform((value) => value === "true" ? true : undefined),
  minRating: z.coerce.number().min(0).max(5).optional().default(0),
  sort: z.enum(["featured", "rating", "newest", "price-low"]).optional().default("featured"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
});

export const creatorOnboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  handle: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Handle must use lowercase letters, numbers, and single hyphens"),
  bio: z.string().trim().min(20).max(500),
});

export const creatorProfileUpdateSchema = creatorOnboardingSchema.pick({ name: true, bio: true });

export const creatorDashboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
});

export const creatorDraftCreateSchema = z.object({ manifest: marketplaceManifestV1Schema }).strict();
export const creatorDraftUpdateSchema = z.object({
  expectedVersion: z.number().int().min(0),
  manifest: marketplaceManifestV1Schema,
}).strict();

const listingLifecycleBaseSchema = z.object({
  expectedVersion: z.number().int().min(0),
  reasonCode: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/).optional(),
  publicReason: z.string().trim().min(10).max(1000).optional(),
}).strict();

export const creatorListingLifecycleSchema = listingLifecycleBaseSchema.extend({
  action: z.enum(["SUBMIT", "WITHDRAW", "ARCHIVE", "RESTORE"]),
});

export const moderatedListingLifecycleSchema = listingLifecycleBaseSchema.extend({
  action: z.enum(["REQUEST_CHANGES", "APPROVE", "PUBLISH", "REJECT", "SUSPEND", "REINSTATE", "ARCHIVE", "RESTORE"]),
});

export const markdownResourceMetadataSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().regex(slugPattern, "Slug must be lowercase with hyphens").max(160),
  description: z.string().trim().min(10).max(500),
  category: z.string().trim().min(2).max(80),
  published: z.union([z.boolean(), z.enum(["true", "false"]).transform((value) => value === "true")]).optional().default(false),
});

export const updateMarkdownResourceSchema = markdownResourceMetadataSchema.partial();

export const editionSchema = z.object({
  number: z.number().int().min(1).max(9999),
  title: z.string().trim().min(3).max(160),
  slug: z.string().regex(slugPattern).max(160),
  description: z.string().trim().min(10).max(500),
  editorialNote: z.string().trim().max(3000).optional().nullable(),
  coverImage: imageUrlSchema.optional().nullable(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color"),
  published: z.boolean().optional().default(false),
  articleIds: z.array(z.string().min(1)).max(30).default([]),
});

export const updateEditionSchema = editionSchema.partial();

export const contentTaxonomySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(slugPattern).max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const commentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  body: z.string().trim().min(3).max(2000),
  website: z.string().max(200).optional(),
});
