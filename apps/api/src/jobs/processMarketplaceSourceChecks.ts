import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Prisma, type MarketplaceSourceCheckOutcome } from "@prisma/client";
import { decryptProviderToken } from "../lib/marketplaceProviderToken.js";
import { ProviderCallError, providerForSourceKind, resolveMarketplaceSource } from "../lib/marketplaceSourceProviders.js";
import { prisma } from "../lib/prisma.js";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 8 * 60 * 60_000];
const RECHECK_INTERVAL_MS = 24 * 60 * 60_000;

type ClaimedSourceCheck = {
  id: string;
  releaseManifestId: string;
  connectionId: string;
  correlationId: string;
  attempts: number;
};

export async function claimMarketplaceSourceChecks(limit = 10): Promise<ClaimedSourceCheck[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  return prisma.$queryRaw<ClaimedSourceCheck[]>(Prisma.sql`
    WITH candidates AS (
      SELECT "id"
      FROM "MarketplaceSourceCheckJob"
      WHERE (
        ("status" IN ('PENDING', 'RETRY') AND "nextAttemptAt" <= NOW())
        OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '15 minutes')
      )
      ORDER BY "nextAttemptAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${boundedLimit}
    )
    UPDATE "MarketplaceSourceCheckJob" AS job
    SET "status" = 'PROCESSING', "lockedAt" = NOW(), "attempts" = job."attempts" + 1, "updatedAt" = NOW()
    FROM candidates
    WHERE job."id" = candidates."id"
    RETURNING job."id", job."releaseManifestId", job."connectionId", job."correlationId", job."attempts"
  `);
}

export async function enqueueDueMarketplaceSourceChecks(limit = 100) {
  const releases = await prisma.marketplaceReleaseManifest.findMany({
    where: {
      publishedAt: { not: null },
      verifiedConnectionId: { not: null },
      OR: [{ sourceNextCheckAt: null }, { sourceNextCheckAt: { lte: new Date() } }],
      verifiedConnection: { revokedAt: null },
    },
    orderBy: [{ sourceNextCheckAt: "asc" }, { id: "asc" }],
    take: Math.max(1, Math.min(limit, 500)),
    select: { id: true, verifiedConnectionId: true },
  });
  let enqueued = 0;
  for (const release of releases) {
    if (!release.verifiedConnectionId) continue;
    try {
      await prisma.marketplaceSourceCheckJob.create({
        data: { releaseManifestId: release.id, connectionId: release.verifiedConnectionId, correlationId: randomUUID() },
      });
      enqueued += 1;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
  return enqueued;
}

function failureDetails(error: unknown): {
  outcome: MarketplaceSourceCheckOutcome;
  errorCode: string;
  statusCode: number | null;
  retryable: boolean;
  retryAfterSeconds?: number;
} {
  if (!(error instanceof ProviderCallError)) {
    return { outcome: "CONFIGURATION_ERROR", errorCode: "SOURCE_CHECK_INTERNAL_ERROR", statusCode: null, retryable: false };
  }
  if (error.kind === "rate_limited") return { outcome: "RATE_LIMITED", errorCode: error.code, statusCode: error.statusCode ?? null, retryable: true, retryAfterSeconds: error.retryAfterSeconds };
  if (error.kind === "transient") return { outcome: "TRANSIENT_FAILURE", errorCode: error.code, statusCode: error.statusCode ?? null, retryable: true };
  if (error.kind === "not_found") return { outcome: "NOT_FOUND", errorCode: error.code, statusCode: error.statusCode ?? null, retryable: false };
  if (error.kind === "unauthorized") return { outcome: "OWNERSHIP_LOST", errorCode: error.code, statusCode: error.statusCode ?? null, retryable: false };
  return { outcome: "MISMATCH", errorCode: error.code, statusCode: error.statusCode ?? null, retryable: false };
}

export async function processMarketplaceSourceCheckJob(job: ClaimedSourceCheck) {
  const startedAt = Date.now();
  const record = await prisma.marketplaceSourceCheckJob.findUnique({
    where: { id: job.id },
    select: {
      releaseManifest: {
        select: {
          id: true,
          sourceKind: true,
          sourceUrl: true,
          sourceRef: true,
          sourcePath: true,
          providerIntegrityDigest: true,
          resolvedInstallationUrl: true,
          publishedAt: true,
        },
      },
      connection: {
        select: {
          id: true,
          provider: true,
          accountLogin: true,
          encryptedToken: true,
          tokenIv: true,
          tokenTag: true,
          revokedAt: true,
        },
      },
    },
  });
  if (!record) return;
  const release = record.releaseManifest;
  const connection = record.connection;
  try {
    if (connection.revokedAt || !connection.encryptedToken) throw new ProviderCallError("unauthorized", "PROVIDER_CONNECTION_REVOKED");
    if (providerForSourceKind(release.sourceKind) !== connection.provider) throw new ProviderCallError("invalid_response", "PROVIDER_SOURCE_MISMATCH");
    const token = decryptProviderToken(connection);
    const resolution = await resolveMarketplaceSource({
      source: release,
      accountLogin: connection.accountLogin,
      token,
      correlationId: job.correlationId,
    });
    if (resolution.resolvedSourceRef !== release.sourceRef
      || (release.providerIntegrityDigest && resolution.providerIntegrityDigest !== release.providerIntegrityDigest)
      || (release.publishedAt && release.resolvedInstallationUrl !== resolution.resolvedInstallationUrl)) {
      throw new ProviderCallError("invalid_response", "SOURCE_IDENTITY_MISMATCH", resolution.statusCode);
    }
    const checkedAt = new Date();
    await prisma.$transaction([
      prisma.marketplaceSourceCheck.create({ data: {
        releaseManifestId: release.id,
        connectionId: connection.id,
        provider: connection.provider,
        outcome: "VERIFIED",
        providerStatusCode: resolution.statusCode,
        resolvedSourceRef: resolution.resolvedSourceRef,
        resolvedInstallationUrl: resolution.resolvedInstallationUrl,
        providerIntegrityDigest: resolution.providerIntegrityDigest,
        artifactSizeBytes: resolution.artifactSizeBytes,
        ownershipVerified: true,
        correlationId: `${job.correlationId}:${job.attempts}`,
        latencyMs: Date.now() - startedAt,
      } }),
      prisma.marketplaceReleaseManifest.update({
        where: { id: release.id },
        data: release.publishedAt ? {
          sourceCheckStatus: "VERIFIED",
          sourceCheckedAt: checkedAt,
          sourceNextCheckAt: new Date(checkedAt.getTime() + RECHECK_INTERVAL_MS),
          sourceFailureCount: 0,
          lastSourceErrorCode: null,
          ownershipVerifiedAt: checkedAt,
          verifiedConnectionId: connection.id,
        } : {
          sourceUrl: resolution.canonicalSourceUrl,
          providerIntegrityDigest: resolution.providerIntegrityDigest,
          artifactSizeBytes: resolution.artifactSizeBytes,
          resolvedInstallationUrl: resolution.resolvedInstallationUrl,
          sourceResolvedAt: checkedAt,
          ownershipVerifiedAt: checkedAt,
          sourceCheckStatus: "VERIFIED",
          sourceCheckedAt: checkedAt,
          sourceNextCheckAt: new Date(checkedAt.getTime() + RECHECK_INTERVAL_MS),
          sourceFailureCount: 0,
          lastSourceErrorCode: null,
          verifiedConnectionId: connection.id,
        },
      }),
      prisma.marketplaceSourceCheckJob.update({ where: { id: job.id }, data: { status: "COMPLETED", lockedAt: null, lastErrorCode: null } }),
    ]);
    console.info(JSON.stringify({ event: "marketplace_source_check", correlationId: job.correlationId, provider: connection.provider.toLowerCase(), outcome: "verified", latencyMs: Date.now() - startedAt }));
  } catch (error) {
    const failure = failureDetails(error);
    const willRetry = failure.retryable && job.attempts < MAX_ATTEMPTS;
    const retryDelay = Math.max(
      RETRY_DELAYS_MS[Math.min(job.attempts - 1, RETRY_DELAYS_MS.length - 1)],
      (failure.retryAfterSeconds ?? 0) * 1000,
    );
    const published = Boolean(release.publishedAt);
    await prisma.$transaction([
      prisma.marketplaceSourceCheck.create({ data: {
        releaseManifestId: release.id,
        connectionId: connection.id,
        provider: connection.provider,
        outcome: failure.outcome,
        providerStatusCode: failure.statusCode,
        ownershipVerified: false,
        errorCode: failure.errorCode,
        correlationId: `${job.correlationId}:${job.attempts}`,
        latencyMs: Date.now() - startedAt,
      } }),
      prisma.marketplaceReleaseManifest.update({
        where: { id: release.id },
        data: {
          sourceCheckStatus: published ? (failure.retryable ? "STALE" : "RESTRICTED") : (willRetry ? "PENDING" : "FAILED"),
          sourceCheckedAt: new Date(),
          sourceNextCheckAt: published
            ? new Date(Date.now() + (willRetry ? retryDelay : RECHECK_INTERVAL_MS))
            : willRetry ? new Date(Date.now() + retryDelay) : null,
          sourceFailureCount: { increment: 1 },
          lastSourceErrorCode: failure.errorCode,
          ...(!published && !willRetry ? { sourceResolvedAt: null, ownershipVerifiedAt: null } : {}),
        },
      }),
      prisma.marketplaceSourceCheckJob.update({
        where: { id: job.id },
        data: {
          status: willRetry ? "RETRY" : "FAILED",
          lockedAt: null,
          nextAttemptAt: willRetry ? new Date(Date.now() + retryDelay) : undefined,
          lastErrorCode: failure.errorCode,
        },
      }),
    ]);
    console.warn(JSON.stringify({ event: "marketplace_source_check", correlationId: job.correlationId, provider: connection.provider.toLowerCase(), outcome: failure.outcome.toLowerCase(), errorCode: failure.errorCode, retry: willRetry, latencyMs: Date.now() - startedAt }));
  }
}

export async function processMarketplaceSourceCheckBatch(limit = Number(process.env.MARKETPLACE_SOURCE_WORKER_BATCH_SIZE ?? 10)) {
  await enqueueDueMarketplaceSourceChecks();
  const claimed = await claimMarketplaceSourceChecks(limit);
  for (const job of claimed) await processMarketplaceSourceCheckJob(job);
  return claimed.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processMarketplaceSourceCheckBatch()
    .then(async (count) => {
      console.info(JSON.stringify({ event: "marketplace_source_check_batch", processed: count }));
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(JSON.stringify({ event: "marketplace_source_check_batch_failed", error: error instanceof Error ? error.message : "unknown" }));
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
