import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isAdminRequest } from "../middleware/auth.js";

export async function listTags(_req: Request, res: Response) {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  res.json({ data: tags });
}

export async function createTag(req: Request, res: Response) {
  const tag = await prisma.tag.create({ data: req.body });
  res.status(201).json({ data: tag });
}

export async function deleteTag(req: Request, res: Response) {
  await prisma.tag.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}

export async function listSeries(req: Request, res: Response) {
  const series = await prisma.series.findMany({
    where: req.query.dossiers === "true" ? { dossierPublished: true } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  const admin = await isAdminRequest(req);
  res.json({ data: series.map((item) => ({ ...item, dossierContent: item.dossierPublished || admin ? item.dossierContent : null })) });
}

export async function getSeries(req: Request, res: Response) {
  const series = await prisma.series.findUnique({
    where: { slug: String(req.params.slug) },
    include: {
      articles: {
        where: { published: true },
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
        select: { id: true, title: true, slug: true, excerpt: true, heroImage: true, publishedAt: true, seriesOrder: true },
      },
    },
  });
  if (!series) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Series not found" } });
    return;
  }
  res.json({ data: { ...series, dossierContent: series.dossierPublished || await isAdminRequest(req) ? series.dossierContent : null } });
}

export async function createSeries(req: Request, res: Response) {
  if (req.body.dossierPublished && !req.body.dossierContent?.trim()) {
    res.status(400).json({ error: { code: "DOSSIER_EMPTY", message: "Add dossier content before publishing" } });
    return;
  }
  const series = await prisma.series.create({ data: { ...req.body, dossierUpdatedAt: req.body.dossierContent ? new Date() : null } });
  res.status(201).json({ data: series });
}

export async function updateSeries(req: Request, res: Response) {
  const current = await prisma.series.findUnique({ where: { id: String(req.params.id) }, select: { dossierContent: true, dossierPublished: true } });
  if (!current) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Series not found" } }); return; }
  const content = req.body.dossierContent === undefined ? current.dossierContent : req.body.dossierContent;
  if ((req.body.dossierPublished ?? current.dossierPublished) && !content?.trim()) {
    res.status(400).json({ error: { code: "DOSSIER_EMPTY", message: "Add dossier content before publishing" } });
    return;
  }
  const series = await prisma.series.update({ where: { id: String(req.params.id) }, data: { ...req.body, ...(req.body.dossierContent !== undefined ? { dossierUpdatedAt: new Date() } : {}) } });
  res.json({ data: series });
}

export async function deleteSeries(req: Request, res: Response) {
  await prisma.series.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}
