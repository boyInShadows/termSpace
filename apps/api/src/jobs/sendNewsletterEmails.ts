import "dotenv/config";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../lib/cloudflareEmail.js";
import { prisma } from "../lib/prisma.js";

const retryDelays = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];
type ClaimedDelivery = { id: string; campaignId: string; attempts: number };

export async function claimNewsletterDeliveries(limit = 10): Promise<ClaimedDelivery[]> {
  const bounded = Math.max(1, Math.min(limit, 50));
  return prisma.$queryRaw<ClaimedDelivery[]>(Prisma.sql`
    WITH candidates AS (
      SELECT delivery."id" FROM "NewsletterDelivery" delivery
      JOIN "NewsletterCampaign" campaign ON campaign."id" = delivery."campaignId"
      WHERE campaign."status" = 'QUEUED' AND (
        (delivery."status" IN ('PENDING', 'RETRY') AND delivery."nextAttemptAt" <= NOW())
        OR (delivery."status" = 'PROCESSING' AND delivery."lockedAt" < NOW() - INTERVAL '15 minutes')
      )
      ORDER BY delivery."nextAttemptAt" ASC
      FOR UPDATE OF delivery SKIP LOCKED LIMIT ${bounded}
    )
    UPDATE "NewsletterDelivery" delivery SET "status" = 'PROCESSING', "lockedAt" = NOW(), "attempts" = delivery."attempts" + 1
    FROM candidates WHERE delivery."id" = candidates."id"
    RETURNING delivery."id", delivery."campaignId", delivery."attempts"
  `);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function processNewsletterBatch(limit = Number(process.env.NEWSLETTER_WORKER_BATCH_SIZE ?? 10)) {
  const claimed = await claimNewsletterDeliveries(limit);
  for (const job of claimed) {
    const delivery = await prisma.newsletterDelivery.findUnique({ where: { id: job.id }, include: { subscriber: true, campaign: { include: { article: { select: { published: true, slug: true } } } } } });
    if (!delivery) continue;
    if (!delivery.subscriber.active || delivery.campaign.status !== "QUEUED" || (delivery.campaign.article && !delivery.campaign.article.published)) {
      await prisma.newsletterDelivery.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "RECIPIENT_OR_ARTICLE_INACTIVE" } });
      continue;
    }
    const configuredOrigin = process.env.BLOG_PUBLIC_URL ?? (process.env.NODE_ENV === "production" ? null : "http://localhost:3001");
    if (!configuredOrigin) {
      await prisma.newsletterDelivery.update({ where: { id: job.id }, data: { status: "FAILED", lockedAt: null, lastErrorCode: "BLOG_URL_NOT_CONFIGURED" } });
      continue;
    }
    const origin = configuredOrigin.replace(/\/$/, "");
    const unsubscribeUrl = `${origin}/unsubscribe?token=${encodeURIComponent(delivery.subscriber.unsubscribeToken)}`;
    const articleUrl = delivery.campaign.article ? `${origin}/blog/${encodeURIComponent(delivery.campaign.article.slug)}` : null;
    const text = `${delivery.campaign.body}${articleUrl ? `\n\nRead the article: ${articleUrl}` : ""}\n\nUnsubscribe: ${unsubscribeUrl}`;
    const html = `<p>${escapeHtml(delivery.campaign.previewText ?? "")}</p><div>${escapeHtml(delivery.campaign.body).replace(/\n/g, "<br>")}</div>${articleUrl ? `<p><a href="${escapeHtml(articleUrl)}">Read the article</a></p>` : ""}<p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`;
    const result = await sendEmail({ to: delivery.subscriber.email, subject: delivery.campaign.subject, text, html, correlationId: job.id });
    const status = result.outcome === "sent" ? "SENT" : result.outcome === "retry" && job.attempts < 5 ? "RETRY" : "FAILED";
    await prisma.newsletterDelivery.update({ where: { id: job.id }, data: {
      status, lockedAt: null, sentAt: status === "SENT" ? new Date() : null,
      nextAttemptAt: status === "RETRY" ? new Date(Date.now() + retryDelays[Math.min(job.attempts - 1, retryDelays.length - 1)]) : undefined,
      lastErrorCode: result.outcome === "sent" ? null : result.errorCode,
    } });
  }
  for (const campaignId of new Set(claimed.map((item) => item.campaignId))) {
    const remaining = await prisma.newsletterDelivery.count({ where: { campaignId, status: { in: ["PENDING", "RETRY", "PROCESSING"] } } });
    if (remaining === 0) await prisma.newsletterCampaign.updateMany({ where: { id: campaignId, status: "QUEUED" }, data: { status: "COMPLETE" } });
  }
  return claimed.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processNewsletterBatch().then(async (count) => { console.info(JSON.stringify({ event: "newsletter_batch", processed: count })); await prisma.$disconnect(); })
    .catch(async (error) => { console.error(JSON.stringify({ event: "newsletter_batch_failed", error: error instanceof Error ? error.message : "unknown" })); await prisma.$disconnect(); process.exitCode = 1; });
}
