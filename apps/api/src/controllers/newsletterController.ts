import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function subscribeToNewsletter(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();

  try {
    await prisma.newsletterSubscriber.create({
      data: { email },
    });
    res.status(202).json({ data: { submitted: true } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(202).json({ data: { submitted: true } });
      return;
    }

    throw err;
  }
}

export async function unsubscribeFromNewsletter(req: Request, res: Response) {
  await prisma.newsletterSubscriber.updateMany({ where: { unsubscribeToken: req.body.token }, data: { active: false } });
  res.status(202).json({ data: { submitted: true } });
}

export async function exportNewsletterSubscribers(_req: Request, res: Response) {
  // ponytail: stream batches if newsletter exports outgrow memory.
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "asc" }, select: { email: true, active: true, subscribedAt: true } });
  const cell = (value: string) => `"${((/^[=+\-@]/.test(value) ? "'" : "") + value).replace(/"/g, '""')}"`;
  const rows = ["email,active,subscribedAt", ...subscribers.map((item) => [cell(item.email), item.active, item.subscribedAt.toISOString()].join(","))];
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=termspace-newsletter-subscribers.csv", "Cache-Control": "no-store" });
  res.send(rows.join("\r\n"));
}

export async function listNewsletterCampaigns(_req: Request, res: Response) {
  const campaigns = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { article: { select: { title: true, slug: true } } } });
  const counts = await prisma.newsletterDelivery.groupBy({ by: ["campaignId", "status"], where: { campaignId: { in: campaigns.map((item) => item.id) } }, _count: { _all: true } });
  res.json({ data: campaigns.map((campaign) => ({ ...campaign, delivery: Object.fromEntries(counts.filter((row) => row.campaignId === campaign.id).map((row) => [row.status, row._count._all])) })) });
}

export async function createNewsletterCampaign(req: Request, res: Response) {
  const article = req.body.articleId ? await prisma.article.findFirst({ where: { id: req.body.articleId, published: true }, select: { title: true, content: true, excerpt: true } }) : null;
  if (req.body.articleId && !article) {
    res.status(400).json({ error: { code: "ARTICLE_UNAVAILABLE", message: "Choose a published article" } });
    return;
  }
  const subject = req.body.subject?.trim() || article?.title;
  const body = req.body.body?.trim() || article?.content;
  if (!subject || !body || body.length > 20_000) {
    res.status(400).json({ error: { code: "CAMPAIGN_EMPTY", message: "A subject and body or published article are required" } });
    return;
  }
  const campaign = await prisma.newsletterCampaign.create({ data: { subject, body, previewText: req.body.previewText?.trim() || article?.excerpt || null, articleId: req.body.articleId || null } });
  res.status(201).json({ data: campaign });
}

export async function queueNewsletterCampaign(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "NewsletterCampaign" WHERE "id" = ${id} FOR UPDATE`);
    const campaign = await tx.newsletterCampaign.findUnique({ where: { id }, select: { status: true } });
    if (!campaign) return "missing";
    if (campaign.status !== "DRAFT") return "already-queued";
    const inserted = await tx.$executeRaw(Prisma.sql`
      INSERT INTO "NewsletterDelivery" ("id", "campaignId", "subscriberId", "status", "attempts", "nextAttemptAt")
      SELECT gen_random_uuid()::text, ${id}, "id", 'PENDING', 0, NOW()
      FROM "NewsletterSubscriber" WHERE "active" = true
      ON CONFLICT ("campaignId", "subscriberId") DO NOTHING
    `);
    if (inserted === 0) return "no-subscribers";
    await tx.newsletterCampaign.update({ where: { id }, data: { status: "QUEUED", queuedAt: new Date() } });
    return inserted;
  });
  if (result === "missing") { res.status(404).json({ error: { code: "NOT_FOUND", message: "Campaign not found" } }); return; }
  if (result === "already-queued") { res.status(409).json({ error: { code: "ALREADY_QUEUED", message: "Campaign was already queued" } }); return; }
  if (result === "no-subscribers") { res.status(409).json({ error: { code: "NO_SUBSCRIBERS", message: "There are no active subscribers" } }); return; }
  res.status(202).json({ data: { queued: result } });
}
