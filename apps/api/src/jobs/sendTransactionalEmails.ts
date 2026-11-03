import "dotenv/config";
import { pathToFileURL } from "node:url";
import { Prisma, type TransactionalEmailStatus } from "@prisma/client";
import { emailConfig, sendEmailChangeEmail, sendEmailChangedNotice, sendModerationDecisionEmail, sendPasswordResetEmail, sendVerificationEmail } from "../lib/cloudflareEmail.js";
import { createEmailChangeToken, createEmailVerificationToken, createPasswordResetToken, emailChangeUrl, passwordResetUrl, verificationSecret, verificationUrl } from "../lib/emailVerification.js";
import { prisma } from "../lib/prisma.js";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 8 * 60 * 60_000];

type ClaimedEmail = {
  id: string;
  verificationId: string | null;
  passwordResetId: string | null;
  emailChangeId: string | null;
  emailChangeNoticeId: string | null;
  notificationId: string | null;
  correlationId: string;
  attempts: number;
};

/**
 * Moderation decisions are the one notification type delivered by email today.
 * The mapping lives here so the database enum stays presentation-free.
 */
const decisionByNotification = {
  LISTING_APPROVED: "approved",
  LISTING_CHANGES_REQUESTED: "changes_requested",
  LISTING_REJECTED: "rejected",
} as const;

export async function claimTransactionalEmails(limit = 10): Promise<ClaimedEmail[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  return prisma.$queryRaw<ClaimedEmail[]>(Prisma.sql`
    WITH candidates AS (
      SELECT "id"
      FROM "TransactionalEmailOutbox"
      WHERE (
        ("status" IN ('PENDING', 'RETRY') AND "nextAttemptAt" <= NOW())
        OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '15 minutes')
      )
      ORDER BY "nextAttemptAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${boundedLimit}
    )
    UPDATE "TransactionalEmailOutbox" AS outbox
    SET "status" = 'PROCESSING', "lockedAt" = NOW(), "attempts" = outbox."attempts" + 1, "updatedAt" = NOW()
    FROM candidates
    WHERE outbox."id" = candidates."id"
    RETURNING outbox."id", outbox."verificationId", outbox."passwordResetId", outbox."emailChangeId", outbox."emailChangeNoticeId", outbox."notificationId", outbox."correlationId", outbox."attempts"
  `);
}

export async function processTransactionalEmailBatch(limit = Number(process.env.EMAIL_WORKER_BATCH_SIZE ?? 10)) {
  // Check configuration before claiming: a misconfigured worker must fail without
  // spending attempts or marking mail FAILED, so fixing the config delivers the backlog.
  verificationSecret();
  emailConfig();
  const claimed = await claimTransactionalEmails(limit);
  for (const job of claimed) {
    let result: Awaited<ReturnType<typeof sendVerificationEmail>>;
    if (job.verificationId) {
      const verification = await prisma.readerEmailVerification.findUnique({
        where: { id: job.verificationId },
        select: { id: true, userId: true, expiresAt: true, consumedAt: true, user: { select: { email: true, emailVerifiedAt: true } } },
      });
      if (!verification || verification.consumedAt || verification.expiresAt <= new Date() || verification.user.emailVerifiedAt) {
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "VERIFICATION_INACTIVE" } });
        continue;
      }
      result = await sendVerificationEmail({
        to: verification.user.email,
        verificationUrl: verificationUrl(createEmailVerificationToken(verification)),
        correlationId: job.correlationId,
      });
    } else if (job.passwordResetId) {
      const reset = await prisma.readerPasswordReset.findUnique({
        where: { id: job.passwordResetId },
        select: { id: true, userId: true, expiresAt: true, consumedAt: true, failedAttempts: true, user: { select: { email: true, passwordHash: true } } },
      });
      if (!reset || reset.consumedAt || reset.expiresAt <= new Date() || !reset.user.passwordHash) {
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "PASSWORD_RESET_INACTIVE" } });
        continue;
      }
      result = await sendPasswordResetEmail({
        to: reset.user.email,
        passwordResetUrl: passwordResetUrl(createPasswordResetToken(reset)),
        correlationId: job.correlationId,
      });
    } else if (job.emailChangeId) {
      const change = await prisma.readerEmailChange.findUnique({
        where: { id: job.emailChangeId },
        select: { id: true, userId: true, newEmail: true, expiresAt: true, consumedAt: true },
      });
      if (!change || change.consumedAt || change.expiresAt <= new Date()) {
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "EMAIL_CHANGE_INACTIVE" } });
        continue;
      }
      result = await sendEmailChangeEmail({
        to: change.newEmail,
        confirmationUrl: emailChangeUrl(createEmailChangeToken(change)),
        correlationId: job.correlationId,
      });
    } else if (job.emailChangeNoticeId) {
      const change = await prisma.readerEmailChange.findUnique({
        where: { id: job.emailChangeNoticeId },
        select: { newEmail: true, previousEmail: true, consumedAt: true },
      });
      if (!change?.consumedAt || !change.previousEmail) {
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "EMAIL_CHANGE_NOTICE_INACTIVE" } });
        continue;
      }
      result = await sendEmailChangedNotice({ to: change.previousEmail, newEmail: change.newEmail, correlationId: job.correlationId });
    } else if (job.notificationId) {
      const notification = await prisma.marketplaceNotification.findUnique({
        where: { id: job.notificationId },
        select: {
          id: true,
          type: true,
          publicReason: true,
          user: { select: { email: true, notifyModerationEmail: true } },
          product: { select: { name: true } },
        },
      });
      if (!notification) {
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "NOTIFICATION_INACTIVE" } });
        continue;
      }
      if (!notification.user.notifyModerationEmail) {
        // The creator opted out after the decision was made.
        await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "NOTIFICATION_OPTED_OUT" } });
        continue;
      }
      const webUrl = (process.env.WEB_PUBLIC_URL ?? "").replace(/\/$/, "");
      result = await sendModerationDecisionEmail({
        to: notification.user.email,
        productName: notification.product.name,
        decision: decisionByNotification[notification.type],
        publicReason: notification.publicReason,
        dashboardUrl: `${webUrl}/dashboard/studio`,
        settingsUrl: `${webUrl}/dashboard/settings#account-preferences`,
        correlationId: job.correlationId,
      });
    } else {
      await prisma.transactionalEmailOutbox.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "INVALID_TARGET" } });
      continue;
    }

    let status: TransactionalEmailStatus;
    if (result.outcome === "sent") status = "SENT";
    else if (result.outcome === "retry" && job.attempts < MAX_ATTEMPTS) status = "RETRY";
    else status = "FAILED";

    await prisma.transactionalEmailOutbox.update({
      where: { id: job.id },
      data: {
        status,
        lockedAt: null,
        sentAt: status === "SENT" ? new Date() : undefined,
        nextAttemptAt: status === "RETRY" ? new Date(Date.now() + RETRY_DELAYS_MS[Math.min(job.attempts - 1, RETRY_DELAYS_MS.length - 1)]) : undefined,
        lastStatusCode: result.statusCode ?? null,
        lastErrorCode: result.outcome === "sent" ? null : result.errorCode,
      },
    });
  }
  return claimed.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  processTransactionalEmailBatch()
    .then(async (count) => {
      console.info(JSON.stringify({ event: "transactional_email_batch", processed: count }));
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(JSON.stringify({ event: "transactional_email_batch_failed", error: error instanceof Error ? error.message : "unknown" }));
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
