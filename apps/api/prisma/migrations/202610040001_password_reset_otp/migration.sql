CREATE TABLE "ReaderPasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReaderPasswordReset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TransactionalEmailOutbox" ALTER COLUMN "verificationId" DROP NOT NULL;
ALTER TABLE "TransactionalEmailOutbox" ADD COLUMN "passwordResetId" TEXT;

CREATE INDEX "ReaderPasswordReset_userId_createdAt_idx" ON "ReaderPasswordReset"("userId", "createdAt");
CREATE INDEX "ReaderPasswordReset_expiresAt_consumedAt_idx" ON "ReaderPasswordReset"("expiresAt", "consumedAt");
CREATE UNIQUE INDEX "TransactionalEmailOutbox_passwordResetId_key" ON "TransactionalEmailOutbox"("passwordResetId");

ALTER TABLE "ReaderPasswordReset" ADD CONSTRAINT "ReaderPasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_passwordResetId_fkey" FOREIGN KEY ("passwordResetId") REFERENCES "ReaderPasswordReset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_exactly_one_target" CHECK (num_nonnulls("verificationId", "passwordResetId") = 1);
