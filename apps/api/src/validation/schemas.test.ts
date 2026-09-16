import { describe, expect, it } from "vitest";
import { articleQuerySchema, commentSchema, createArticleSchema, creatorDashboardQuerySchema, creatorOnboardingSchema, editionSchema, markdownResourceMetadataSchema, readerCredentialsSchema, readerLibrarySyncSchema, readerPasswordChangeSchema } from "./schemas.js";

const article = {
  title: "A valid title",
  slug: "a-valid-title",
  content: "Enough article content to pass validation.",
  authorId: "author-1",
  categoryId: "category-1",
};

describe("content validation", () => {
  it("preserves an omitted article publication filter", () => {
    expect(articleQuerySchema.parse({}).published).toBeUndefined();
    expect(articleQuerySchema.parse({ published: "true" }).published).toBe(true);
    expect(articleQuerySchema.parse({ published: "false" }).published).toBe(false);
  });

  it("accepts tags, series, and scheduled publication", () => {
    const result = createArticleSchema.safeParse({
      ...article,
      tagIds: ["tag-1"],
      seriesId: "series-1",
      seriesOrder: 2,
      scheduledAt: "2026-09-01T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unapproved remote image hosts", () => {
    expect(createArticleSchema.safeParse({ ...article, heroImage: "https://example.com/image.jpg" }).success).toBe(false);
  });

  it("validates comment limits and honeypot", () => {
    expect(commentSchema.safeParse({ name: "Reader", email: "reader@example.com", body: "Thoughtful response", website: "" }).success).toBe(true);
    expect(commentSchema.safeParse({ name: "R", email: "bad", body: "x" }).success).toBe(false);
  });

  it("validates reader credentials and local-library sync payloads", () => {
    expect(readerCredentialsSchema.safeParse({ email: "reader@example.com", password: "long-password" }).success).toBe(true);
    expect(readerCredentialsSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(readerLibrarySyncSchema.safeParse({ bookmarks: [{ slug: "useful-post", progress: 25, visitedAt: "2026-08-25T08:00:00.000Z" }], history: [] }).success).toBe(true);
  });

  it("validates reader password changes", () => {
    expect(readerPasswordChangeSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password" }).success).toBe(true);
    expect(readerPasswordChangeSchema.safeParse({ currentPassword: "old-password", newPassword: "short" }).success).toBe(false);
  });

  it("normalizes valid creator handles and rejects unstable forms", () => {
    const valid = creatorOnboardingSchema.parse({ name: "Tool Builder", handle: "Tool-Builder", bio: "I build dependable agentic coding tools for teams." });
    expect(valid.handle).toBe("tool-builder");
    expect(creatorOnboardingSchema.safeParse({ ...valid, handle: "tool--builder" }).success).toBe(false);
    expect(creatorOnboardingSchema.safeParse({ ...valid, handle: "ابزار" }).success).toBe(false);
  });

  it("bounds creator dashboard pagination", () => {
    expect(creatorDashboardQuerySchema.parse({})).toEqual({ page: 1, limit: 24 });
    expect(creatorDashboardQuerySchema.parse({ page: "2", limit: "12" })).toEqual({ page: 2, limit: 12 });
    expect(creatorDashboardQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("validates Markdown resource metadata from multipart forms", () => {
    expect(markdownResourceMetadataSchema.safeParse({ title: "Review checklist", slug: "review-checklist", description: "A useful review checklist.", category: "Engineering", published: "true" }).success).toBe(true);
    expect(markdownResourceMetadataSchema.safeParse({ title: "No", slug: "Bad Slug", description: "short", category: "E" }).success).toBe(false);
  });

  it("validates editorial edition composition", () => {
    expect(editionSchema.safeParse({ number: 2, title: "Software After Interfaces", slug: "software-after-interfaces", description: "A focused collection about the next interface era.", accentColor: "#b45309", published: true, articleIds: ["article-1"] }).success).toBe(true);
    expect(editionSchema.safeParse({ number: 0, title: "No", slug: "Bad", description: "short", accentColor: "orange", articleIds: [] }).success).toBe(false);
  });
});
