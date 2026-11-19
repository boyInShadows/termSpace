BEGIN;
-- Fresh databases and retained support installations share one additive baseline.
-- This deliberately leaves legacy migration records/checksums untouched.
DO $$ BEGIN CREATE TYPE "SupportCategory" AS ENUM ('TECHNICAL', 'LISTING', 'GENERAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SupportStatus" AS ENUM ('WAITING_FOR_SUPPORT', 'WAITING_FOR_MEMBER', 'RESOLVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SupportAuthorRole" AS ENUM ('MEMBER', 'ADMINISTRATOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TYPE "SupportMessageKind" AS ENUM ('MESSAGE', 'RESOLVED', 'REOPENED');
DO $$ BEGIN CREATE TYPE "SupportNotificationType" AS ENUM ('TICKET_CREATED', 'MEMBER_REPLIED', 'STAFF_REPLIED', 'RESOLVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "category" "SupportCategory" NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "SupportStatus" NOT NULL DEFAULT 'WAITING_FOR_SUPPORT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id" TEXT PRIMARY KEY,
  "ticketId" TEXT NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "authorId" TEXT REFERENCES "ReaderUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "authorRole" "SupportAuthorRole" NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "SupportMessage" ADD COLUMN "kind" "SupportMessageKind" NOT NULL DEFAULT 'MESSAGE';
CREATE INDEX IF NOT EXISTS "SupportTicket_ownerId_updatedAt_id_idx" ON "SupportTicket"("ownerId", "updatedAt", "id");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_updatedAt_id_idx" ON "SupportTicket"("status", "updatedAt", "id");
CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_id_idx" ON "SupportMessage"("ticketId", "createdAt", "id");

CREATE TABLE IF NOT EXISTS "SupportAttachment" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL REFERENCES "SupportMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "storageKey" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportAttachment_storageKey_key" ON "SupportAttachment"("storageKey");
CREATE INDEX IF NOT EXISTS "SupportAttachment_messageId_idx" ON "SupportAttachment"("messageId");
CREATE TABLE IF NOT EXISTS "SupportNotification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "ticketId" TEXT NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "type" "SupportNotificationType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "SupportNotification_userId_readAt_createdAt_id_idx" ON "SupportNotification"("userId", "readAt", "createdAt", "id");
COMMIT;
