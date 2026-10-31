-- Creator notifications for moderation decisions.
-- In-app rows always exist; the email row is optional and controlled by the
-- reader's email preference. Only the public reason is copied, never the
-- internal moderation note.
ALTER TABLE "ReaderUser" ADD COLUMN "notifyModerationEmail" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "MarketplaceNotificationType" AS ENUM ('LISTING_APPROVED', 'LISTING_CHANGES_REQUESTED', 'LISTING_REJECTED');

CREATE TABLE "MarketplaceNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MarketplaceNotificationType" NOT NULL,
    "productId" TEXT NOT NULL,
    "publicReason" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceNotification_userId_readAt_createdAt_idx" ON "MarketplaceNotification"("userId", "readAt", "createdAt");
CREATE INDEX "MarketplaceNotification_productId_createdAt_idx" ON "MarketplaceNotification"("productId", "createdAt");

ALTER TABLE "MarketplaceNotification" ADD CONSTRAINT "MarketplaceNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceNotification" ADD CONSTRAINT "MarketplaceNotification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A notification email is one more kind of outbox target.
ALTER TABLE "TransactionalEmailOutbox" ADD COLUMN "notificationId" TEXT;
CREATE UNIQUE INDEX "TransactionalEmailOutbox_notificationId_key" ON "TransactionalEmailOutbox"("notificationId");
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "MarketplaceNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransactionalEmailOutbox" DROP CONSTRAINT "TransactionalEmailOutbox_exactly_one_target";
ALTER TABLE "TransactionalEmailOutbox" ADD CONSTRAINT "TransactionalEmailOutbox_exactly_one_target" CHECK (num_nonnulls("verificationId", "passwordResetId", "emailChangeId", "emailChangeNoticeId", "notificationId") = 1);
