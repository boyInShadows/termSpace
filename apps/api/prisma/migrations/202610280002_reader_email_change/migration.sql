-- CreateTable
CREATE TABLE "ReaderEmailChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "previousEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReaderEmailChange_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TransactionalEmailOutbox" ADD COLUMN "emailChangeId" TEXT,
ADD COLUMN "emailChangeNoticeId" TEXT;

-- CreateIndex
CREATE INDEX "ReaderEmailChange_userId_createdAt_idx" ON "ReaderEmailChange"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReaderEmailChange_expiresAt_consumedAt_idx" ON "ReaderEmailChange"("expiresAt", "consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionalEmailOutbox_emailChangeId_key" ON "TransactionalEmailOutbox"("emailChangeId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionalEmailOutbox_emailChangeNoticeId_key" ON "TransactionalEmailOutbox"("emailChangeNoticeId");

-- AddForeignKey
ALTER TABLE "ReaderEmailChange" ADD CONSTRAINT "ReaderEmailChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_emailChangeId_fkey" FOREIGN KEY ("emailChangeId") REFERENCES "ReaderEmailChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_emailChangeNoticeId_fkey" FOREIGN KEY ("emailChangeNoticeId") REFERENCES "ReaderEmailChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every outbox row still targets exactly one thing.
ALTER TABLE "TransactionalEmailOutbox" DROP CONSTRAINT "TransactionalEmailOutbox_exactly_one_target";
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_exactly_one_target" CHECK (num_nonnulls("verificationId", "passwordResetId", "emailChangeId", "emailChangeNoticeId") = 1);
