-- CreateEnum
CREATE TYPE "MarketplaceReportReason" AS ENUM ('MALICIOUS', 'UNDISCLOSED_PERMISSIONS', 'SOURCE_COMPROMISE', 'IMPERSONATION', 'MISLEADING', 'BROKEN_OR_ABANDONED', 'SPAM_OR_ABUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketplaceModerationCaseState" AS ENUM ('NEW', 'TRIAGED', 'INVESTIGATING', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "MarketplaceModerationSeverity" AS ENUM ('STANDARD', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MarketplaceModerationCaseActor" AS ENUM ('READER', 'MODERATOR', 'ADMINISTRATOR');

-- CreateTable
CREATE TABLE "MarketplaceModerationCase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reason" "MarketplaceReportReason" NOT NULL,
    "openKey" TEXT,
    "state" "MarketplaceModerationCaseState" NOT NULL DEFAULT 'NEW',
    "severity" "MarketplaceModerationSeverity" NOT NULL DEFAULT 'STANDARD',
    "version" INTEGER NOT NULL DEFAULT 0,
    "publicReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceModerationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceReport" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceModerationCaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorType" "MarketplaceModerationCaseActor" NOT NULL,
    "action" TEXT NOT NULL,
    "previousState" "MarketplaceModerationCaseState",
    "resultingState" "MarketplaceModerationCaseState" NOT NULL,
    "previousSeverity" "MarketplaceModerationSeverity",
    "resultingSeverity" "MarketplaceModerationSeverity" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "publicReason" TEXT,
    "evidenceReference" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceModerationCaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceModerationCase_openKey_key" ON "MarketplaceModerationCase"("openKey");

-- CreateIndex
CREATE INDEX "MarketplaceModerationCase_state_severity_createdAt_idx" ON "MarketplaceModerationCase"("state", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceModerationCase_productId_createdAt_idx" ON "MarketplaceModerationCase"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceReport_reporterId_createdAt_idx" ON "MarketplaceReport"("reporterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceReport_caseId_reporterId_key" ON "MarketplaceReport"("caseId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceModerationCaseEvent_correlationId_key" ON "MarketplaceModerationCaseEvent"("correlationId");

-- CreateIndex
CREATE INDEX "MarketplaceModerationCaseEvent_caseId_createdAt_idx" ON "MarketplaceModerationCaseEvent"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketplaceModerationCase" ADD CONSTRAINT "MarketplaceModerationCase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceModerationCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceModerationCaseEvent" ADD CONSTRAINT "MarketplaceModerationCaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MarketplaceModerationCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceModerationCaseEvent" ADD CONSTRAINT "MarketplaceModerationCaseEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MarketplaceModerationCase" ADD CONSTRAINT "MarketplaceModerationCase_open_key_state"
  CHECK (("state" IN ('ACTIONED', 'DISMISSED') AND "openKey" IS NULL)
    OR ("state" NOT IN ('ACTIONED', 'DISMISSED') AND "openKey" = "productId" || ':' || "reason"::text AND "openKey" IS NOT NULL));

-- Preserve original evidence and append-only decisions even if a later code path attempts to rewrite them.
CREATE FUNCTION "marketplace_report_audit_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Marketplace reports and case audit events are append-only' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "MarketplaceReport_immutable" BEFORE UPDATE OR DELETE ON "MarketplaceReport"
  FOR EACH ROW EXECUTE FUNCTION "marketplace_report_audit_immutable"();
CREATE TRIGGER "MarketplaceModerationCaseEvent_immutable" BEFORE UPDATE OR DELETE ON "MarketplaceModerationCaseEvent"
  FOR EACH ROW EXECUTE FUNCTION "marketplace_report_audit_immutable"();
