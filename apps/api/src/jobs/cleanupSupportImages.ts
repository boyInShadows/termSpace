import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { cleanupSupportImages } from "../lib/supportImageCleanup.js";

const correlationId = randomUUID();
try {
  const removed = await cleanupSupportImages();
  console.info(JSON.stringify({ event: "support_image_cleanup_completed", correlationId, removed }));
} catch (error) {
  console.error(JSON.stringify({ event: "support_image_cleanup_failed", correlationId, errorName: error instanceof Error ? error.name : "UnknownError" }));
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
