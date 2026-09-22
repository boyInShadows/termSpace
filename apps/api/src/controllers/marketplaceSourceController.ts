import { randomUUID } from "node:crypto";
import { Prisma, type MarketplaceProvider } from "@prisma/client";
import type { Request, Response } from "express";
import { encryptProviderToken } from "../lib/marketplaceProviderToken.js";
import { ProviderCallError, providerForSourceKind, verifyProviderCredential } from "../lib/marketplaceSourceProviders.js";
import { prisma } from "../lib/prisma.js";

const activeJobStatuses = ["PENDING", "PROCESSING", "RETRY"] as const;

function providerFromParam(value: string): MarketplaceProvider {
  return value.toUpperCase() as MarketplaceProvider;
}

function serializeConnection(connection: {
  id: string;
  provider: MarketplaceProvider;
  accountLogin: string;
  lastVerifiedAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: connection.id,
    provider: connection.provider.toLowerCase(),
    accountLogin: connection.accountLogin,
    lastVerifiedAt: connection.lastVerifiedAt,
    revokedAt: connection.revokedAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

function sendProviderError(res: Response, error: ProviderCallError, correlationId: string) {
  if (error.kind === "unauthorized") {
    res.status(401).json({ error: { code: "PROVIDER_CREDENTIAL_REJECTED", message: "The provider rejected this credential", correlationId } });
    return;
  }
  if (error.kind === "rate_limited") {
    res.status(429).json({ error: { code: "PROVIDER_RATE_LIMITED", message: "The provider rate limit was reached; try again later", correlationId } });
    return;
  }
  if (error.kind === "transient") {
    res.status(503).json({ error: { code: "PROVIDER_UNAVAILABLE", message: "The provider could not be reached", correlationId } });
    return;
  }
  res.status(400).json({ error: { code: "PROVIDER_RESPONSE_INVALID", message: "The provider response could not be verified", correlationId } });
}

async function ownedCreator(userId: string) {
  return prisma.marketplaceCreator.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
}

export async function listOwnedProviderConnections(_req: Request, res: Response) {
  const creator = await ownedCreator(res.locals.reader.id as string);
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Creator profile not found" } });
    return;
  }
  const connections = await prisma.marketplaceProviderConnection.findMany({
    where: { creatorId: creator.id },
    orderBy: { provider: "asc" },
    select: { id: true, provider: true, accountLogin: true, lastVerifiedAt: true, revokedAt: true, createdAt: true, updatedAt: true },
  });
  res.json({ data: connections.map(serializeConnection) });
}

export async function connectOwnedProvider(req: Request, res: Response) {
  const creator = await ownedCreator(res.locals.reader.id as string);
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Creator profile not found" } });
    return;
  }
  const provider = providerFromParam(String(req.params.provider));
  const correlationId = randomUUID();
  try {
    const identity = await verifyProviderCredential(provider, req.body.token, correlationId);
    const encrypted = encryptProviderToken(req.body.token);
    const connection = await prisma.marketplaceProviderConnection.upsert({
      where: { creatorId_provider: { creatorId: creator.id, provider } },
      create: {
        creatorId: creator.id,
        provider,
        providerAccountId: identity.accountId,
        accountLogin: identity.accountLogin,
        ...encrypted,
        lastVerifiedAt: new Date(),
      },
      update: {
        providerAccountId: identity.accountId,
        accountLogin: identity.accountLogin,
        ...encrypted,
        lastVerifiedAt: new Date(),
        revokedAt: null,
      },
      select: { id: true, provider: true, accountLogin: true, lastVerifiedAt: true, revokedAt: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json({ data: serializeConnection(connection) });
  } catch (error) {
    if (error instanceof ProviderCallError) {
      sendProviderError(res, error, correlationId);
      return;
    }
    throw error;
  }
}

export async function revokeOwnedProvider(req: Request, res: Response) {
  const creator = await ownedCreator(res.locals.reader.id as string);
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Creator profile not found" } });
    return;
  }
  const provider = providerFromParam(String(req.params.provider));
  const result = await prisma.$transaction(async (tx) => {
    const revoked = await tx.marketplaceProviderConnection.updateMany({
      where: { creatorId: creator.id, provider, revokedAt: null },
      data: { revokedAt: new Date(), encryptedToken: "", tokenIv: "", tokenTag: "" },
    });
    if (revoked.count) {
      await tx.marketplaceReleaseManifest.updateMany({
        where: { verifiedConnection: { creatorId: creator.id, provider }, publishedAt: { not: null }, sourceCheckStatus: "VERIFIED" },
        data: { sourceCheckStatus: "STALE", sourceNextCheckAt: null, lastSourceErrorCode: "PROVIDER_CONNECTION_REVOKED" },
      });
    }
    return revoked;
  });
  if (!result.count) {
    res.status(404).json({ error: { code: "PROVIDER_CONNECTION_NOT_FOUND", message: "Active provider connection not found" } });
    return;
  }
  res.status(204).end();
}

export async function enqueueOwnedSourceCheck(req: Request, res: Response) {
  const productId = String(req.params.id);
  const userId = res.locals.reader.id as string;
  try {
    const job = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 3))`;
      const product = await tx.marketplaceProduct.findUnique({
        where: { id: productId },
        select: {
          lifecycleVersion: true,
          creator: { select: { id: true, ownerUserId: true } },
          proposedSnapshot: { select: { releaseManifest: { select: { id: true, sourceKind: true, publishedAt: true } } } },
        },
      });
      if (!product || product.creator.ownerUserId !== userId) throw new SourceCheckRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      if (product.lifecycleVersion !== req.body.expectedVersion) throw new SourceCheckRequestError(409, "LISTING_VERSION_CONFLICT", "The listing changed; reload it before trying again");
      const release = product.proposedSnapshot?.releaseManifest;
      if (!release) throw new SourceCheckRequestError(409, "RELEASE_MANIFEST_REQUIRED", "Save a release draft before verifying its source");
      if (release.publishedAt) throw new SourceCheckRequestError(409, "PUBLISHED_RELEASE_IMMUTABLE", "Create a new release draft to change or re-verify this source");
      const provider = providerForSourceKind(release.sourceKind);
      const connection = await tx.marketplaceProviderConnection.findUnique({
        where: { creatorId_provider: { creatorId: product.creator.id, provider } },
        select: { id: true, revokedAt: true },
      });
      if (!connection || connection.revokedAt) throw new SourceCheckRequestError(409, "PROVIDER_CONNECTION_REQUIRED", `Connect ${provider === "GITHUB" ? "GitHub" : "npm"} before verifying this source`);
      const existing = await tx.marketplaceSourceCheckJob.findFirst({
        where: { releaseManifestId: release.id, status: { in: [...activeJobStatuses] } },
        select: { id: true, status: true, correlationId: true },
      });
      if (existing) return existing;
      const created = await tx.marketplaceSourceCheckJob.create({
        data: { releaseManifestId: release.id, connectionId: connection.id, requestedByUserId: userId, correlationId: randomUUID() },
        select: { id: true, status: true, correlationId: true },
      });
      await tx.marketplaceReleaseManifest.update({
        where: { id: release.id },
        data: { sourceCheckStatus: "PENDING", lastSourceErrorCode: null },
      });
      return created;
    });
    res.status(202).json({ data: { id: job.id, status: job.status.toLowerCase(), correlationId: job.correlationId } });
  } catch (error) {
    if (error instanceof SourceCheckRequestError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.marketplaceSourceCheckJob.findFirst({
        where: { releaseManifestId: { in: await ownedProposedReleaseIds(productId, userId) }, status: { in: [...activeJobStatuses] } },
        select: { id: true, status: true, correlationId: true },
      });
      if (existing) {
        res.status(202).json({ data: { id: existing.id, status: existing.status.toLowerCase(), correlationId: existing.correlationId } });
        return;
      }
    }
    throw error;
  }
}

async function ownedProposedReleaseIds(productId: string, userId: string) {
  const product = await prisma.marketplaceProduct.findFirst({
    where: { id: productId, creator: { ownerUserId: userId } },
    select: { proposedSnapshot: { select: { releaseManifestId: true } } },
  });
  return product?.proposedSnapshot?.releaseManifestId ? [product.proposedSnapshot.releaseManifestId] : [];
}

class SourceCheckRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}
