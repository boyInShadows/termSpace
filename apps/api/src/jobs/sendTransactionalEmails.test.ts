import { beforeEach, describe, expect, it, vi } from "vitest";

const sendVerificationEmail = vi.hoisted(() => vi.fn());
const sendPasswordResetEmail = vi.hoisted(() => vi.fn());
const sendEmailChangeEmail = vi.hoisted(() => vi.fn());
const sendModerationDecisionEmail = vi.hoisted(() => vi.fn());
const emailConfig = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  readerEmailVerification: { findUnique: vi.fn() },
  readerPasswordReset: { findUnique: vi.fn() },
  readerEmailChange: { findUnique: vi.fn() },
  marketplaceNotification: { findUnique: vi.fn() },
  transactionalEmailOutbox: { update: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/cloudflareEmail.js", () => ({ emailConfig, sendEmailChangeEmail, sendModerationDecisionEmail, sendPasswordResetEmail, sendVerificationEmail }));

process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
process.env.WEB_PUBLIC_URL = "https://termspace.example";
const { processTransactionalEmailBatch } = await import("./sendTransactionalEmails.js");

describe("transactional email worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ id: "outbox-1", verificationId: "verification-1", passwordResetId: null, emailChangeId: null, emailChangeNoticeId: null, notificationId: null, correlationId: "correlation-1", attempts: 1 }]);
    prismaMock.readerEmailVerification.findUnique.mockResolvedValue({
      id: "verification-1", userId: "reader-1", expiresAt: new Date(Date.now() + 60_000), consumedAt: null,
      user: { email: "reader@example.com", emailVerifiedAt: null },
    });
    prismaMock.transactionalEmailOutbox.update.mockResolvedValue({});
  });

  it("marks accepted deliveries sent", async () => {
    sendVerificationEmail.mockResolvedValue({ outcome: "sent", statusCode: 200 });
    await expect(processTransactionalEmailBatch()).resolves.toBe(1);
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "outbox-1" }, data: expect.objectContaining({ status: "SENT", sentAt: expect.any(Date) }),
    }));
  });

  it("refuses to claim mail while the provider is not configured", async () => {
    emailConfig.mockImplementationOnce(() => { throw new Error("Cloudflare Email Service credentials and sender are not configured"); });
    await expect(processTransactionalEmailBatch()).rejects.toThrow("not configured");
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(prismaMock.transactionalEmailOutbox.update).not.toHaveBeenCalled();
  });

  it("refuses to claim mail without a signing secret", async () => {
    const secret = process.env.EMAIL_VERIFICATION_SECRET;
    process.env.EMAIL_VERIFICATION_SECRET = "short";
    try {
      await expect(processTransactionalEmailBatch()).rejects.toThrow("EMAIL_VERIFICATION_SECRET");
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    } finally {
      process.env.EMAIL_VERIFICATION_SECRET = secret;
    }
  });

  it("reschedules transient failures with bounded attempts", async () => {
    sendVerificationEmail.mockResolvedValue({ outcome: "retry", statusCode: 503, errorCode: "HTTP_503" });
    await processTransactionalEmailBatch();
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "RETRY", nextAttemptAt: expect.any(Date), lastErrorCode: "HTTP_503" }),
    }));
  });

  it("cancels expired verification jobs without calling the provider", async () => {
    prismaMock.readerEmailVerification.findUnique.mockResolvedValueOnce({
      id: "verification-1", userId: "reader-1", expiresAt: new Date(Date.now() - 1), consumedAt: null,
      user: { email: "reader@example.com", emailVerifiedAt: null },
    });
    await processTransactionalEmailBatch();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }));
  });

  it("stops retrying after the final delivery attempt", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "outbox-1", verificationId: "verification-1", passwordResetId: null, correlationId: "correlation-1", attempts: 5 }]);
    sendVerificationEmail.mockResolvedValue({ outcome: "retry", statusCode: 503, errorCode: "HTTP_503" });
    await processTransactionalEmailBatch();
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });

  it("delivers active password reset jobs through the shared outbox", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "outbox-reset", verificationId: null, passwordResetId: "reset-1", correlationId: "correlation-reset", attempts: 1 }]);
    prismaMock.readerPasswordReset.findUnique.mockResolvedValue({
      id: "reset-1", userId: "reader-1", expiresAt: new Date(Date.now() + 60_000), consumedAt: null, failedAttempts: 0,
      user: { email: "reader@example.com", passwordHash: "hash" },
    });
    sendPasswordResetEmail.mockResolvedValue({ outcome: "sent", statusCode: 200 });

    await expect(processTransactionalEmailBatch()).resolves.toBe(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      to: "reader@example.com",
      passwordResetUrl: expect.stringMatching(/^https:\/\/termspace\.example\/account\/reset-password#token=reset-1\./),
      correlationId: "correlation-reset",
    });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("delivers a moderation decision to the listing owner", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "outbox-notification", verificationId: null, passwordResetId: null, emailChangeId: null, emailChangeNoticeId: null, notificationId: "notification-1", correlationId: "correlation-moderation", attempts: 1 }]);
    prismaMock.marketplaceNotification.findUnique.mockResolvedValue({
      id: "notification-1", type: "LISTING_CHANGES_REQUESTED", publicReason: "Clarify network access.",
      user: { email: "creator@example.com", notifyModerationEmail: true },
      product: { name: "Owned Skill" },
    });
    sendModerationDecisionEmail.mockResolvedValue({ outcome: "sent", statusCode: 200 });

    await expect(processTransactionalEmailBatch()).resolves.toBe(1);
    expect(sendModerationDecisionEmail).toHaveBeenCalledWith({
      to: "creator@example.com",
      productName: "Owned Skill",
      decision: "changes_requested",
      publicReason: "Clarify network access.",
      dashboardUrl: "https://termspace.example/dashboard/studio",
      settingsUrl: "https://termspace.example/dashboard/settings#account-preferences",
      correlationId: "correlation-moderation",
    });
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "outbox-notification" }, data: expect.objectContaining({ status: "SENT" }),
    }));
  });

  it("cancels a queued moderation email when the owner opted out", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ id: "outbox-notification", verificationId: null, passwordResetId: null, emailChangeId: null, emailChangeNoticeId: null, notificationId: "notification-1", correlationId: "correlation-moderation", attempts: 1 }]);
    prismaMock.marketplaceNotification.findUnique.mockResolvedValue({
      id: "notification-1", type: "LISTING_APPROVED", publicReason: null,
      user: { email: "creator@example.com", notifyModerationEmail: false },
      product: { name: "Owned Skill" },
    });

    await processTransactionalEmailBatch();
    expect(sendModerationDecisionEmail).not.toHaveBeenCalled();
    expect(prismaMock.transactionalEmailOutbox.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "outbox-notification" },
      data: expect.objectContaining({ status: "CANCELLED", lastErrorCode: "NOTIFICATION_OPTED_OUT" }),
    }));
  });
});
