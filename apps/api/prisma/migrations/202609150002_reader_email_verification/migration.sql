CREATE TYPE "TransactionalEmailStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "ReaderEmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReaderEmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionalEmailOutbox" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" "TransactionalEmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastStatusCode" INTEGER,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TransactionalEmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReaderEmailVerification_userId_createdAt_idx" ON "ReaderEmailVerification"("userId", "createdAt");
CREATE INDEX "ReaderEmailVerification_expiresAt_consumedAt_idx" ON "ReaderEmailVerification"("expiresAt", "consumedAt");
CREATE UNIQUE INDEX "TransactionalEmailOutbox_verificationId_key" ON "TransactionalEmailOutbox"("verificationId");
CREATE UNIQUE INDEX "TransactionalEmailOutbox_correlationId_key" ON "TransactionalEmailOutbox"("correlationId");
CREATE INDEX "TransactionalEmailOutbox_status_nextAttemptAt_idx" ON "TransactionalEmailOutbox"("status", "nextAttemptAt");
CREATE INDEX "TransactionalEmailOutbox_lockedAt_idx" ON "TransactionalEmailOutbox"("lockedAt");

ALTER TABLE "ReaderEmailVerification" ADD CONSTRAINT "ReaderEmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "ReaderEmailVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
