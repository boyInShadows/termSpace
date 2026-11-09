BEGIN;
-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('TECHNICAL', 'LISTING', 'GENERAL');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('WAITING_FOR_SUPPORT', 'WAITING_FOR_MEMBER', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportAuthorRole" AS ENUM ('MEMBER', 'ADMINISTRATOR');

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "category" "SupportCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'WAITING_FOR_SUPPORT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorRole" "SupportAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_ownerId_updatedAt_id_idx" ON "SupportTicket"("ownerId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_id_idx" ON "SupportTicket"("status", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_createdAt_id_idx" ON "SupportMessage"("ticketId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "ReaderUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;


COMMIT;
