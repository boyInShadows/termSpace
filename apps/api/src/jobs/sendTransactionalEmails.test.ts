import { beforeEach, describe, expect, it, vi } from "vitest";

const sendVerificationEmail = vi.hoisted(() => vi.fn());
const sendPasswordResetEmail = vi.hoisted(() => vi.fn());
const emailConfig = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  readerEmailVerification: { findUnique: vi.fn() },
  readerPasswordReset: { findUnique: vi.fn() },
  transactionalEmailOutbox: { update: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/cloudflareEmail.js", () => ({ emailConfig, sendPasswordResetEmail, sendVerificationEmail }));

process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
process.env.WEB_PUBLIC_URL = "https://termspace.example";
const { processTransactionalEmailBatch } = await import("./sendTransactionalEmails.js");

describe("transactional email worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ id: "outbox-1", verificationId: "verification-1", passwordResetId: null, correlationId: "correlation-1", attempts: 1 }]);
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
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({ to: "reader@example.com", code: expect.stringMatching(/^\d{6}$/), correlationId: "correlation-reset" });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
