import { beforeEach, describe, expect, it, vi } from "vitest";

const sendVerificationEmail = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  readerEmailVerification: { findUnique: vi.fn() },
  transactionalEmailOutbox: { update: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/cloudflareEmail.js", () => ({ sendVerificationEmail }));

process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
process.env.WEB_PUBLIC_URL = "https://termspace.example";
const { processTransactionalEmailBatch } = await import("./sendTransactionalEmails.js");

describe("transactional email worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ id: "outbox-1", verificationId: "verification-1", correlationId: "correlation-1", attempts: 1 }]);
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
});
