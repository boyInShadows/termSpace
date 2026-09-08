import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { isAdminRequest } from "../middleware/auth.js";

/**
 * Article controller.
 * Handles CRUD plus list filtering, search, sorting, and pagination.
 */

const articleSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  heroImage: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  scheduledAt: true,
  previewToken: true,
  seriesOrder: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  series: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.ArticleSelect;

const articleListSelect = {
  ...articleSelect,
  content: true,
} satisfies Prisma.ArticleSelect;

function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toArticleSummary(article: Prisma.ArticleGetPayload<{ select: typeof articleListSelect }>) {
  const { content, tags, previewToken: _previewToken, ...summary } = article;
  return {
    ...summary,
    tags: tags.map(({ tag }) => tag),
    readingMinutes: readingMinutes(content),
  };
}

function toArticleDetail<T extends { tags: { tag: { id: string; name: string; slug: string } }[] }>(article: T, includePreviewToken = false) {
  const { tags, previewToken: _previewToken, ...detail } = article as T & { previewToken?: string | null };
  return { ...detail, ...(includePreviewToken ? { previewToken: _previewToken ?? null } : {}), tags: tags.map(({ tag }) => tag) };
}

type ArticleQuery = {
  page: number;
  limit: number;
  category?: string;
  tag?: string;
  series?: string;
  search?: string;
  published?: boolean;
  sort: "newest" | "oldest" | "title";
};

class ArticleEditConflictError extends Error {}

export async function listArticles(req: Request, res: Response) {
  const { page, limit, category, tag, series, search, published, sort } = req.query as unknown as ArticleQuery;
  if (published !== true && !(await isAdminRequest(req))) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Sign in with an administrator account to list drafts",
      },
    });
    return;
  }

  let searchIds: string[] | undefined;
  if (search) {
    const normalizedSearch = search.trim().toLowerCase().slice(0, 120);
    if (normalizedSearch) {
      const searchConfig = /[\u0600-\u06ff]/u.test(normalizedSearch) ? "simple" : "english";
      const matches = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "Article"
        WHERE to_tsvector(${searchConfig}::regconfig, coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content", ''))
          @@ websearch_to_tsquery(${searchConfig}::regconfig, ${normalizedSearch})
        ORDER BY ts_rank(
          to_tsvector(${searchConfig}::regconfig, coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content", '')),
          websearch_to_tsquery(${searchConfig}::regconfig, ${normalizedSearch})
        ) DESC
      `);
      searchIds = matches.map(({ id }) => id);
    }
  }

  const where: Prisma.ArticleWhereInput = {
    ...(published !== undefined ? { published } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    ...(series ? { series: { slug: series } } : {}),
    ...(searchIds ? { id: { in: searchIds } } : {}),
  };

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ publishedAt: "asc" }, { id: "asc" }]
      : sort === "title"
        ? [{ title: "asc" }, { id: "asc" }]
        : [{ publishedAt: "desc" }, { id: "desc" }];

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: articleListSelect,
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    data: items.map(toArticleSummary),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export async function listPopularSearches(_req: Request, res: Response) {
  res.json({ data: [] });
}

export async function getArticleBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const isAdmin = await isAdminRequest(req);
  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      ...articleSelect,
      content: true,
      author: { select: { id: true, name: true, bio: true, avatarUrl: true } },
    },
  });

  if (!article) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    return;
  }

  if (!article.published && !isAdmin) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    return;
  }

  res.json({ data: toArticleDetail(article, isAdmin) });
}

export async function getArticlePreview(req: Request, res: Response) {
  const article = await prisma.article.findUnique({
    where: { previewToken: String(req.params.token) },
    select: { ...articleSelect, content: true, author: { select: { id: true, name: true, bio: true, avatarUrl: true } } },
  });
  if (!article) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Preview not found" } });
    return;
  }
  res.json({ data: toArticleDetail(article, true) });
}

export async function createArticle(req: Request, res: Response) {
  const body = req.body;
  const published = body.published ?? false;
  const publishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : published
      ? new Date()
      : null;

  const article = await prisma.article.create({
    data: {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? null,
      content: body.content,
      heroImage: body.heroImage ?? null,
      published,
      publishedAt,
      // A published article is live immediately; never retain a schedule
      // that could later make its state ambiguous.
      scheduledAt: published ? null : body.scheduledAt ? new Date(body.scheduledAt) : null,
      previewToken: randomBytes(24).toString("base64url"),
      authorId: body.authorId,
      categoryId: body.categoryId,
      seriesId: body.seriesId ?? null,
      seriesOrder: body.seriesOrder ?? null,
      tags: body.tagIds?.length
        ? { create: body.tagIds.map((tagId: string) => ({ tag: { connect: { id: tagId } } })) }
        : undefined,
    },
    select: articleSelect,
  });

  res.status(201).json({ data: toArticleDetail(article, true) });
}

export async function updateArticle(req: Request, res: Response) {
  const id = String(req.params.id);
  const body = req.body;
  try {
    const article = await prisma.$transaction(async (tx) => {
      // Lock the row before reading the snapshot. This prevents two editors
      // with the same expectedUpdatedAt from both creating revisions and
      // overwriting each other.
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Article" WHERE "id" = ${id} FOR UPDATE`);
      const existingSnapshot = await tx.article.findUnique({
        where: { id },
        include: { tags: { select: { tagId: true } } },
      });
      if (!existingSnapshot) return null;
      if (body.expectedUpdatedAt && existingSnapshot.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ArticleEditConflictError();
      }

      let publishedAtUpdate: Date | null | undefined;
      if (body.publishedAt !== undefined) {
        publishedAtUpdate = body.publishedAt ? new Date(body.publishedAt) : null;
      } else if (body.published === true) {
        publishedAtUpdate = existingSnapshot.publishedAt ?? new Date();
      }

      const effectivePublished = body.published ?? existingSnapshot.published;
      const scheduledAtUpdate = body.scheduledAt !== undefined
        ? (body.scheduledAt ? new Date(body.scheduledAt) : null)
        : undefined;
      const normalizedScheduledAt = effectivePublished ? null : scheduledAtUpdate;

      await tx.articleRevision.create({
        data: { articleId: id, snapshot: JSON.parse(JSON.stringify(existingSnapshot)) },
      });

      return tx.article.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
          ...(body.content !== undefined ? { content: body.content } : {}),
          ...(body.heroImage !== undefined ? { heroImage: body.heroImage } : {}),
          ...(body.published !== undefined ? { published: body.published } : {}),
          ...(publishedAtUpdate !== undefined ? { publishedAt: publishedAtUpdate } : {}),
          ...(body.authorId !== undefined ? { authorId: body.authorId } : {}),
          ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
          ...(normalizedScheduledAt !== undefined || effectivePublished ? { scheduledAt: normalizedScheduledAt } : {}),
          ...(body.seriesId !== undefined ? { seriesId: body.seriesId } : {}),
          ...(body.seriesOrder !== undefined ? { seriesOrder: body.seriesOrder } : {}),
          ...(body.tagIds !== undefined
            ? { tags: { deleteMany: {}, create: body.tagIds.map((tagId: string) => ({ tag: { connect: { id: tagId } } })) } }
            : {}),
        },
        select: articleSelect,
      });
    });

    if (!article) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
      return;
    }
    res.json({ data: toArticleDetail(article, true) });
  } catch (error) {
    if (error instanceof ArticleEditConflictError) {
      res.status(409).json({ error: { code: "EDIT_CONFLICT", message: "This article was changed in another session. Refresh before saving." } });
      return;
    }
    throw error;
  }
}

export async function listArticleRevisions(req: Request, res: Response) {
  const revisions = await prisma.articleRevision.findMany({
    where: { articleId: String(req.params.id) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ data: revisions });
}

export async function restoreArticleRevision(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Article" WHERE "id" = ${id} FOR UPDATE`);
    const [revision, current] = await Promise.all([
      tx.articleRevision.findFirst({ where: { id: String(req.params.revisionId), articleId: id } }),
      tx.article.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } }),
    ]);
    if (!revision) return { kind: "revision-not-found" as const };
    if (!current) return { kind: "article-not-found" as const };

    // Preserve the state being replaced so restoring this revision can itself
    // be undone from the revision history.
    await tx.articleRevision.create({
      data: { articleId: id, snapshot: JSON.parse(JSON.stringify(current)) },
    });

    const snapshot = revision.snapshot as Record<string, unknown> & { tags?: { tagId: string }[] };
    const article = await tx.article.update({
      where: { id },
      data: {
        title: String(snapshot.title), slug: String(snapshot.slug), excerpt: snapshot.excerpt as string | null,
        content: String(snapshot.content), heroImage: snapshot.heroImage as string | null,
        published: Boolean(snapshot.published), publishedAt: snapshot.publishedAt ? new Date(String(snapshot.publishedAt)) : null,
        scheduledAt: snapshot.scheduledAt ? new Date(String(snapshot.scheduledAt)) : null,
        authorId: String(snapshot.authorId), categoryId: String(snapshot.categoryId),
        seriesId: snapshot.seriesId ? String(snapshot.seriesId) : null,
        seriesOrder: typeof snapshot.seriesOrder === "number" ? snapshot.seriesOrder : null,
        tags: { deleteMany: {}, create: (snapshot.tags ?? []).map(({ tagId }) => ({ tag: { connect: { id: tagId } } })) },
      },
      select: articleSelect,
    });
    return { kind: "restored" as const, article };
  });
  if (result.kind === "revision-not-found") {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Revision not found" } });
    return;
  }
  if (result.kind === "article-not-found") {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    return;
  }
  const article = result.article;
  res.json({ data: toArticleDetail(article) });
}

export async function deleteArticle(req: Request, res: Response) {
  const id = String(req.params.id);
  await prisma.article.delete({ where: { id } });
  res.status(204).send();
}
