import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";

export async function publishScheduledArticles(now = new Date()) {
  const correlationId = randomUUID();
  const startedAt = Date.now();
  try {
    const result = await prisma.article.updateMany({
      where: { published: false, scheduledAt: { lte: now } },
      data: { published: true, publishedAt: now, scheduledAt: null },
    });
    console.info(JSON.stringify({ event: "scheduled_publish_completed", correlationId, count: result.count, latencyMs: Date.now() - startedAt }));
    return result.count;
  } catch (error) {
    console.error(JSON.stringify({ event: "scheduled_publish_failed", correlationId, errorName: error instanceof Error ? error.name : "UnknownError", latencyMs: Date.now() - startedAt }));
    throw error;
  }
}

try {
  await publishScheduledArticles();
} finally {
  await prisma.$disconnect();
}
