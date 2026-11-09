CREATE TYPE "SupportNotificationType" AS ENUM ('TICKET_CREATED', 'MEMBER_REPLIED', 'STAFF_REPLIED', 'RESOLVED');
CREATE TABLE "SupportNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "SupportNotificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "SupportNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportNotification_userId_readAt_createdAt_id_idx" ON "SupportNotification"("userId", "readAt", "createdAt", "id");
ALTER TABLE "SupportNotification" ADD CONSTRAINT "SupportNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportNotification" ADD CONSTRAINT "SupportNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
