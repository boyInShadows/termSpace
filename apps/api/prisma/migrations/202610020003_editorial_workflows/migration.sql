ALTER TABLE "Article" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'ARTICLE', ADD COLUMN "perspectivePrompt" TEXT;
ALTER TABLE "Series" ADD COLUMN "dossierContent" TEXT, ADD COLUMN "dossierPublished" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "dossierUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT, ADD COLUMN "curated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubscribeToken" TEXT;
UPDATE "NewsletterSubscriber" SET "unsubscribeToken" = gen_random_uuid()::text;
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" SET NOT NULL;
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");

CREATE TABLE "NewsletterCampaign" (
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "body" TEXT NOT NULL,
  "articleId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "queuedAt" TIMESTAMP(3),
  CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");

CREATE TABLE "NewsletterDelivery" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "NewsletterDelivery_campaignId_subscriberId_key" ON "NewsletterDelivery"("campaignId", "subscriberId");
CREATE INDEX "NewsletterDelivery_status_nextAttemptAt_idx" ON "NewsletterDelivery"("status", "nextAttemptAt");
