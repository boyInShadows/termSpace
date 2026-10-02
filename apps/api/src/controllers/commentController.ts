import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listPublicComments(req: Request, res: Response) {
  const comments = await prisma.comment.findMany({
    where: { article: { slug: String(req.query.article), published: true }, approved: true, OR: [{ parentId: null }, { parent: { approved: true } }] },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: { id: true, name: true, body: true, createdAt: true, parentId: true, curated: true },
  });
  res.json({ data: comments });
}

export async function createComment(req: Request, res: Response) {
  if (req.body.website) {
    res.status(202).json({ data: { submitted: true } });
    return;
  }
  const article = await prisma.article.findFirst({
    where: { slug: String(req.params.slug), published: true },
    select: { id: true },
  });
  if (!article) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    return;
  }
  const parentId = req.body.parentId ?? null;
  if (parentId) {
    const parent = await prisma.comment.findFirst({ where: { id: parentId, articleId: article.id, approved: true }, select: { id: true } });
    if (!parent) {
      res.status(400).json({ error: { code: "INVALID_PARENT", message: "Reply to an approved comment on this article" } });
      return;
    }
  }
  await prisma.comment.create({
    data: { articleId: article.id, parentId, name: req.body.name, email: req.body.email, body: req.body.body },
  });
  res.status(202).json({ data: { submitted: true, message: "Comment submitted for moderation" } });
}

export async function listAdminComments(_req: Request, res: Response) {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { article: { select: { title: true, slug: true } }, parent: { select: { name: true, body: true, approved: true } } },
  });
  res.json({ data: comments });
}

export async function approveComment(req: Request, res: Response) {
  const existing = await prisma.comment.findUnique({ where: { id: String(req.params.id) }, select: { parent: { select: { approved: true } } } });
  if (existing?.parent && !existing.parent.approved) {
    res.status(409).json({ error: { code: "PARENT_PENDING", message: "Approve the parent comment first" } });
    return;
  }
  const comment = await prisma.comment.update({
    where: { id: String(req.params.id) },
    data: { approved: true, approvedAt: new Date() },
  });
  res.json({ data: comment });
}

export async function curateComment(req: Request, res: Response) {
  const comment = await prisma.comment.findUnique({ where: { id: String(req.params.id) }, select: { approved: true } });
  if (!comment?.approved && req.body.curated) {
    res.status(409).json({ error: { code: "COMMENT_PENDING", message: "Approve the comment before featuring it" } });
    return;
  }
  const updated = await prisma.comment.update({ where: { id: String(req.params.id) }, data: { curated: req.body.curated } });
  res.json({ data: updated });
}

export async function deleteComment(req: Request, res: Response) {
  await prisma.comment.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}
