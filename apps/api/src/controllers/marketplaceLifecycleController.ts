import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  MarketplaceLifecycleError,
  marketplaceProductProjectionFromManifest,
  publicMarketplaceListingState,
  resolveMarketplaceListingTransition,
  type MarketplaceLifecycleActor,
  type MarketplaceListingAction,
  type MarketplaceListingStateValue,
} from "../lib/marketplaceListingLifecycle.js";
import { validateMarketplaceManifest } from "../lib/marketplaceManifest.js";

class LifecycleRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

const productLifecycleSelect = {
  id: true,
  slug: true,
  published: true,
  lifecycleState: true,
  lifecycleVersion: true,
  lifecycleResumeState: true,
  lifecycleResumePublished: true,
  approvedSnapshotId: true,
  proposedSnapshotId: true,
  proposedSnapshot: {
    select: { content: true, schemaVersion: true, releaseManifest: { select: { id: true, publishedAt: true, sourceResolvedAt: true, ownershipVerifiedAt: true } } },
  },
  approvedSnapshot: {
    select: { schemaVersion: true, releaseManifest: { select: { sourceResolvedAt: true, ownershipVerifiedAt: true } } },
  },
  lifecycleEvents: {
    where: { action: "ARCHIVED" as const },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { actorType: true },
  },
  creator: { select: { ownerUserId: true } },
} as const;

const publicReasonActions = new Set<MarketplaceListingAction>(["REQUEST_CHANGES", "REJECT", "SUSPEND"]);

function actorFor(readerRoles: string[], creatorRequest: boolean): MarketplaceLifecycleActor {
  if (creatorRequest) return "CREATOR";
  return readerRoles.includes("administrator") ? "ADMINISTRATOR" : "MODERATOR";
}

function lifecycleEventSnapshotId(input: {
  action: MarketplaceListingAction;
  previousPublished: boolean;
  previousApprovedSnapshotId: string | null;
  previousProposedSnapshotId: string | null;
  resultingPublished: boolean;
  resultingApprovedSnapshotId: string | null;
  resultingProposedSnapshotId: string | null;
}) {
  if (input.action === "APPROVE" || input.action === "PUBLISH") return input.previousProposedSnapshotId;
  if ((input.action === "SUSPEND" || input.action === "ARCHIVE") && input.previousPublished) {
    return input.previousApprovedSnapshotId;
  }
  if ((input.action === "REINSTATE" || input.action === "RESTORE") && input.resultingPublished) {
    return input.resultingApprovedSnapshotId;
  }
  return input.resultingProposedSnapshotId ?? input.resultingApprovedSnapshotId;
}

async function transitionListing(req: Request, res: Response, creatorRequest: boolean) {
  const productId = String(req.params.id);
  const userId = res.locals.reader.id as string;
  const action = req.body.action as MarketplaceListingAction;
  const actorType = actorFor(res.locals.reader.marketplaceRoles, creatorRequest);
  if (publicReasonActions.has(action) && !req.body.publicReason) {
    res.status(400).json({ error: { code: "PUBLIC_REASON_REQUIRED", message: "A public-safe reason is required for this decision" } });
    return;
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 2))`;
      const product = await tx.marketplaceProduct.findUnique({ where: { id: productId }, select: productLifecycleSelect });
      if (!product) throw new LifecycleRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      if (creatorRequest && product.creator.ownerUserId !== userId) {
        throw new LifecycleRequestError(404, "LISTING_NOT_FOUND", "Marketplace listing not found");
      }
      if (!creatorRequest && product.creator.ownerUserId === userId) {
        throw new LifecycleRequestError(403, "SELF_MODERATION_FORBIDDEN", "Staff cannot moderate a listing they own");
      }
      if (product.lifecycleVersion !== req.body.expectedVersion) {
        throw new LifecycleRequestError(409, "LISTING_VERSION_CONFLICT", "The listing changed; reload it before trying again");
      }
      if (["SUBMIT", "PUBLISH", "REINSTATE"].includes(action) || (action === "RESTORE" && product.lifecycleResumePublished)) {
        const sourceSnapshot = action === "SUBMIT" || action === "PUBLISH" ? product.proposedSnapshot : product.approvedSnapshot;
        const restoringGrandfatheredLegacyPublication = (action === "REINSTATE" || action === "RESTORE")
          && product.lifecycleResumePublished
          && sourceSnapshot?.schemaVersion === 0;
        const sourceVerified = restoringGrandfatheredLegacyPublication
          || Boolean(sourceSnapshot?.releaseManifest?.sourceResolvedAt && sourceSnapshot.releaseManifest.ownershipVerifiedAt);
        if (!sourceVerified) {
          throw new LifecycleRequestError(409, "SOURCE_VERIFICATION_REQUIRED", "Resolve the exact release source and verify ownership before this transition");
        }
      }

      const transition = resolveMarketplaceListingTransition({
        state: product.lifecycleState as MarketplaceListingStateValue,
        published: product.published,
        hasApprovedSnapshot: Boolean(product.approvedSnapshotId),
        hasProposedSnapshot: Boolean(product.proposedSnapshotId),
        resumeState: product.lifecycleResumeState as MarketplaceListingStateValue | null,
        resumePublished: product.lifecycleResumePublished,
        archivedBy: (product.lifecycleEvents?.[0]?.actorType as MarketplaceLifecycleActor | "SYSTEM" | undefined) ?? null,
      }, action, actorType);
      const approvedSnapshotId = transition.approvedSnapshot === "promote-proposed" ? product.proposedSnapshotId : product.approvedSnapshotId;
      const proposedSnapshotId = transition.proposedSnapshot === "clear" ? null : product.proposedSnapshotId;
      const correlationId = randomUUID();
      let publicationProjection = {};
      if (action === "PUBLISH") {
        if (!product.proposedSnapshot) throw new LifecycleRequestError(409, "PROPOSED_SNAPSHOT_REQUIRED", "Approved publication candidate is missing");
        let manifest;
        try {
          manifest = validateMarketplaceManifest(product.proposedSnapshot.content).manifest;
        } catch {
          throw new LifecycleRequestError(409, "INVALID_PROPOSED_SNAPSHOT", "The approved snapshot no longer satisfies the manifest contract");
        }
        const category = await tx.marketplaceCategory.findUnique({ where: { slug: manifest.listing.categorySlug }, select: { id: true } });
        if (!category) throw new LifecycleRequestError(409, "CATEGORY_NOT_FOUND", "The approved listing category is unavailable");
        publicationProjection = marketplaceProductProjectionFromManifest(manifest, category.id);
        const releaseManifest = product.proposedSnapshot.releaseManifest;
        if (!releaseManifest) throw new LifecycleRequestError(409, "RELEASE_MANIFEST_REQUIRED", "The approved publication candidate has no release manifest");
        if (!releaseManifest.publishedAt) {
          await tx.marketplaceReleaseManifest.update({
            where: { id: releaseManifest.id },
            data: { publishedAt: new Date() },
          });
        }
      }

      const next = await tx.marketplaceProduct.update({
        where: { id: product.id },
        data: {
          lifecycleState: transition.state,
          lifecycleVersion: { increment: 1 },
          lifecycleResumeState: transition.resumeState,
          lifecycleResumePublished: transition.resumePublished,
          published: transition.published,
          approvedSnapshotId,
          proposedSnapshotId,
          ...publicationProjection,
        },
        select: { id: true, slug: true, lifecycleState: true, lifecycleVersion: true, published: true, approvedSnapshotId: true, proposedSnapshotId: true },
      });
      await tx.marketplaceListingLifecycleEvent.create({
        data: {
          productId: product.id,
          snapshotId: lifecycleEventSnapshotId({
            action,
            previousPublished: product.published,
            previousApprovedSnapshotId: product.approvedSnapshotId,
            previousProposedSnapshotId: product.proposedSnapshotId,
            resultingPublished: transition.published,
            resultingApprovedSnapshotId: approvedSnapshotId,
            resultingProposedSnapshotId: proposedSnapshotId,
          }),
          previousState: product.lifecycleState,
          resultingState: transition.state,
          action: transition.eventAction,
          actorType,
          actorUserId: userId,
          reasonCode: req.body.reasonCode ?? transition.eventAction,
          publicReason: req.body.publicReason,
          correlationId,
        },
      });
      return { ...next, correlationId };
    });

    res.json({ data: {
      id: updated.id,
      slug: updated.slug,
      state: publicMarketplaceListingState(updated.lifecycleState as MarketplaceListingStateValue),
      version: updated.lifecycleVersion,
      published: updated.published,
      approvedSnapshotId: updated.approvedSnapshotId,
      proposedSnapshotId: updated.proposedSnapshotId,
      correlationId: updated.correlationId,
    } });
  } catch (error) {
    if (error instanceof LifecycleRequestError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof MarketplaceLifecycleError) {
      res.status(409).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: { code: "LISTING_CONFLICT", message: "The approved listing conflicts with an existing marketplace record" } });
      return;
    }
    throw error;
  }
}

export async function transitionOwnedMarketplaceListing(req: Request, res: Response) {
  await transitionListing(req, res, true);
}

export async function transitionModeratedMarketplaceListing(req: Request, res: Response) {
  await transitionListing(req, res, false);
}
