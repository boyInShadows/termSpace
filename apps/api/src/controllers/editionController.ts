import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const articleSelect = {
  id: true, title: true, slug: true, excerpt: true, heroImage: true, published: true,
  publishedAt: true, createdAt: true, updatedAt: true, scheduledAt: true, seriesOrder: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  series: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
} as const;

const editionInclude = {
  articles: { where: { article: { published: true } }, orderBy: { position: "asc" as const }, select: { position: true, article: { select: articleSelect } } },
};

const adminEditionInclude = {
  articles: { orderBy: { position: "asc" as const }, select: { position: true, article: { select: articleSelect } } },
};

function serialize<T extends { articles: { position: number; article: { tags: { tag: { id: string; name: string; slug: string } }[] } }[] }>(edition: T) {
  return { ...edition, articles: edition.articles.map(({ position, article }) => ({ ...article, position, tags: article.tags.map(({ tag }) => tag) })) };
}

export async function listEditions(_req: Request, res: Response) {
  const editions = await prisma.edition.findMany({ where: { published: true }, orderBy: { number: "desc" }, include: editionInclude });
  res.json({ data: editions.map(serialize) });
}

export async function getCurrentEdition(_req: Request, res: Response) {
  const edition = await prisma.edition.findFirst({ where: { published: true }, orderBy: [{ publishedAt: "desc" }, { number: "desc" }], include: editionInclude });
  res.json({ data: edition ? serialize(edition) : null });
}

export async function getEdition(req: Request, res: Response) {
  const edition = await prisma.edition.findFirst({ where: { slug: String(req.params.slug), published: true }, include: editionInclude });
  if (!edition) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Edition not found" } }); return; }
  res.json({ data: serialize(edition) });
}

export async function listAdminEditions(_req: Request, res: Response) {
  const editions = await prisma.edition.findMany({ orderBy: { number: "desc" }, include: adminEditionInclude });
  res.json({ data: editions.map(serialize) });
}

function editionData(body: Record<string, unknown>, existingPublished = false) {
  const { articleIds, ...fields } = body as { articleIds?: string[]; published?: boolean } & Record<string, unknown>;
  return {
    ...fields,
    ...(body.published === true && !existingPublished ? { publishedAt: new Date() } : {}),
    ...(body.published === false ? { publishedAt: null } : {}),
    ...(articleIds ? { articles: { deleteMany: {}, create: articleIds.map((articleId, position) => ({ articleId, position: position + 1 })) } } : {}),
  };
}

export async function createEdition(req: Request, res: Response) {
  const edition = await prisma.edition.create({ data: editionData(req.body) as never, include: adminEditionInclude });
  res.status(201).json({ data: serialize(edition) });
}

export async function updateEdition(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.edition.findUnique({ where: { id }, select: { published: true } });
  if (!existing) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Edition not found" } }); return; }
  const edition = await prisma.edition.update({ where: { id }, data: editionData(req.body, existing.published) as never, include: adminEditionInclude });
  res.json({ data: serialize(edition) });
}

export async function deleteEdition(req: Request, res: Response) {
  await prisma.edition.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}
