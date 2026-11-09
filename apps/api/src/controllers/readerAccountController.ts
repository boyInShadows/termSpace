import { compare } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import type { MarketplaceListingState, Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { READER_SESSION_COOKIE } from "../middleware/auth.js";
import { lockProductReviews, recomputeRating } from "./marketplaceReviewController.js";
import { requireActiveSupportAccounts, SupportSessionError } from "../lib/supportAccess.js";
import { removeSupportImages } from "../lib/supportImages.js";
import { visibleSupportNotifications } from "../lib/supportNotifications.js";

const googleClient = new OAuth2Client();

/** A creator must withdraw or archive these before the account can be deleted. */
const LIVE_LISTING_STATES: MarketplaceListingState[] = ["SUBMITTED", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "SUSPENDED"];

const supportMessageExport = {
  id: true, body: true, authorRole: true, createdAt: true,
  attachments: { select: { id: true, bytes: true, width: true, height: true } },
} as const;

function exportSupportMessages<Message extends Prisma.SupportMessageGetPayload<{ select: typeof supportMessageExport }>>(messages: Message[], staff = false) {
  return messages.map(message => ({ ...message, attachments: message.attachments.map(attachment => ({
    ...attachment, downloadPath: `/api/support${staff ? "/admin" : ""}/attachments/${encodeURIComponent(attachment.id)}`,
  })) }));
}

class AccountError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

const fail = (res: Response, error: AccountError) => res.status(error.status).json({ error: { code: error.code, message: error.message } });

/** The subject of a valid Google ID token, so a Google-only account can prove it is still in control. */
async function googleSubject(credential: unknown) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new AccountError(503, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured");
  if (typeof credential !== "string" || !credential) throw new AccountError(400, "GOOGLE_CREDENTIAL_REQUIRED", "Confirm with Google to delete this account");
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email_verified) throw new Error("Unverified Google account");
    return payload.sub;
  } catch {
    throw new AccountError(401, "INVALID_GOOGLE_CREDENTIAL", "Google sign-in could not be verified");
  }
}

/** Ends every other signed-in session of the caller; the session making this request stays. */
export async function revokeOtherReaderSessions(_req: Request, res: Response) {
  const { count } = await prisma.readerSession.deleteMany({
    where: { userId: res.locals.reader.id as string, id: { not: res.locals.readerSessionId as string } },
  });
  res.json({ data: { revoked: count } });
}

/**
 * Everything the reader owns, as a download. Secrets (password hash, session
 * tokens, provider credentials, the Google subject) are never included.
 */
export async function exportReaderData(_req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const user = await prisma.readerUser.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      email: true, createdAt: true, emailVerifiedAt: true, passwordHash: true, googleSubject: true,
      onboardingRole: true, onboardingGoal: true, onboardingTools: true, onboardingIntent: true,
      marketplaceRoleGrants: { select: { role: true, grantedAt: true, revokedAt: true }, orderBy: { grantedAt: "asc" } },
      bookmarks: { select: { createdAt: true, article: { select: { slug: true, title: true } } }, orderBy: { createdAt: "asc" } },
      progress: { select: { percentage: true, visitedAt: true, article: { select: { slug: true, title: true } } }, orderBy: { visitedAt: "asc" } },
      productFavorites: { select: { createdAt: true, product: { select: { slug: true, name: true } } }, orderBy: { createdAt: "asc" } },
      marketplaceOrders: { select: { createdAt: true, status: true, product: { select: { slug: true, name: true } } }, orderBy: { createdAt: "asc" } },
      marketplaceReviews: {
        select: { rating: true, body: true, author: true, published: true, hiddenAt: true, createdAt: true, updatedAt: true, product: { select: { slug: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      marketplaceReports: { select: { explanation: true, createdAt: true, case: { select: { reason: true } } } },
      supportTickets: {
        select: { id: true, category: true, subject: true, status: true, createdAt: true, updatedAt: true,
          messages: { select: supportMessageExport, orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      supportMessages: {
        where: { ticket: { ownerId: { not: userId } } },
        select: { ...supportMessageExport, ticketId: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      supportNotifications: {
        where: visibleSupportNotifications(res.locals.reader),
        select: { id: true, type: true, ticketId: true, readAt: true, createdAt: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      marketplaceCreator: {
        select: {
          name: true, handle: true, bio: true, createdAt: true,
          products: { select: { slug: true, name: true, lifecycleState: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Reader account not found" } });
    return;
  }
  const { passwordHash, googleSubject: subject, emailVerifiedAt, marketplaceReports, ...rest } = user;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", 'attachment; filename="termspace-account-export.json"');
  res.json({
    data: {
      exportedAt: new Date().toISOString(),
      account: { email: rest.email, createdAt: rest.createdAt, emailVerified: Boolean(emailVerifiedAt), hasPassword: Boolean(passwordHash), connectedGoogle: Boolean(subject) },
      marketplaceRoleGrants: rest.marketplaceRoleGrants,
      articleBookmarks: rest.bookmarks.map(({ article, createdAt }) => ({ ...article, savedAt: createdAt })),
      readingProgress: rest.progress.map(({ article, percentage, visitedAt }) => ({ ...article, percentage, visitedAt })),
      favorites: rest.productFavorites.map(({ product, createdAt }) => ({ ...product, savedAt: createdAt })),
      acquisitions: rest.marketplaceOrders.map(({ product, status, createdAt }) => ({ ...product, status, acquiredAt: createdAt })),
      reviews: rest.marketplaceReviews.map(({ product, ...review }) => ({ ...product, ...review })),
      reportsFiled: marketplaceReports.map(({ case: moderationCase, ...report }) => ({ reason: moderationCase.reason, ...report })),
      creatorProfile: rest.marketplaceCreator,
      supportTickets: rest.supportTickets.map(ticket => ({ ...ticket, messages: exportSupportMessages(ticket.messages) })),
      supportMessages: exportSupportMessages(rest.supportMessages, true),
      supportNotifications: rest.supportNotifications,
      profileDetails: { role: rest.onboardingRole, goal: rest.onboardingGoal, tools: rest.onboardingTools, intent: rest.onboardingIntent },
    },
  });
}

/**
 * Anonymizes the account in one transaction. The row itself is kept because
 * orders, reports and audit events reference it with `onDelete: Restrict`.
 */
export async function deleteReaderAccount(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  let supportImageKeys: string[] = [];
  try {
    const user = await prisma.readerUser.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true, googleSubject: true, deletedAt: true } });
    if (!user || user.deletedAt) throw new AccountError(404, "NOT_FOUND", "Reader account not found");

    if (user.passwordHash) {
      const password = req.body.currentPassword;
      if (typeof password !== "string" || !password) throw new AccountError(400, "CURRENT_PASSWORD_REQUIRED", "Enter your current password");
      if (!(await compare(password, user.passwordHash))) throw new AccountError(401, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
    } else if (!user.googleSubject || (await googleSubject(req.body.credential)) !== user.googleSubject) {
      throw new AccountError(401, "INVALID_GOOGLE_CREDENTIAL", "Google sign-in could not be verified");
    }

    await prisma.$transaction(async (tx) => {
      await requireActiveSupportAccounts(tx, [userId]);
      const creator = await tx.marketplaceCreator.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
      if (creator && await tx.marketplaceProduct.count({ where: { creatorId: creator.id, lifecycleState: { in: LIVE_LISTING_STATES } } })) {
        throw new AccountError(409, "CREATOR_LISTINGS_ACTIVE", "Withdraw or archive your submitted and published listings before deleting this account");
      }

      // Lock in a stable order so two deletions touching the same listings cannot deadlock.
      const reviewed = await tx.marketplaceReview.findMany({ where: { userId }, select: { productId: true }, distinct: ["productId"], orderBy: { productId: "asc" } });
      for (const { productId } of reviewed) await lockProductReviews(tx, productId);
      await tx.marketplaceReview.deleteMany({ where: { userId } });
      for (const { productId } of reviewed) await recomputeRating(tx, productId);

      if (creator) {
        const revokedAt = new Date();
        await tx.marketplaceReleaseManifest.updateMany({
          where: { verifiedConnection: { creatorId: creator.id }, publishedAt: { not: null }, sourceCheckStatus: "VERIFIED" },
          data: { sourceCheckStatus: "STALE", sourceNextCheckAt: null, lastSourceErrorCode: "PROVIDER_CONNECTION_REVOKED" },
        });
        await tx.marketplaceProviderConnection.updateMany({
          where: { creatorId: creator.id },
          data: { revokedAt, encryptedToken: "", tokenIv: "", tokenTag: "", accountLogin: "", providerAccountId: "" },
        });
        await tx.marketplaceCreator.update({
          where: { id: creator.id },
          data: { name: "Deleted creator", handle: `deleted-${creator.id}`, initials: "DC", avatarUrl: null, bio: "", verified: false, followers: 0 },
        });
      }

      const images = await tx.supportAttachment.findMany({
        where: { OR: [{ message: { ticket: { ownerId: userId } } }, { message: { authorId: userId } }] },
        select: { storageKey: true },
      });
      supportImageKeys = images.map(image => image.storageKey);
      await tx.supportNotification.deleteMany({ where: { userId } });
      await tx.supportAttachment.deleteMany({ where: { message: { authorId: userId } } });
      await tx.supportMessage.updateMany({ where: { authorId: userId, ticket: { ownerId: { not: userId } } }, data: { authorId: null, body: "" } });
      await tx.supportTicket.deleteMany({ where: { ownerId: userId } });
      await tx.readerSession.deleteMany({ where: { userId } });
      await tx.readerBookmark.deleteMany({ where: { userId } });
      await tx.readerReadingProgress.deleteMany({ where: { userId } });
      await tx.marketplaceFavorite.deleteMany({ where: { userId } });
      await tx.readerEmailVerification.deleteMany({ where: { userId } });
      await tx.readerPasswordReset.deleteMany({ where: { userId } });
      await tx.marketplaceNotification.deleteMany({ where: { userId } });
      await tx.marketplaceRoleGrant.deleteMany({ where: { userId } });
      // The newsletter row belongs to the address, not the tombstone; stop delivery.
      await tx.newsletterSubscriber.updateMany({ where: { email: user.email }, data: { active: false } });
      await tx.readerUser.update({
        where: { id: userId },
        data: { email: `deleted-${userId}@deleted.invalid`, passwordHash: null, googleSubject: null, emailVerifiedAt: null, deletedAt: new Date(), onboardingRole: null, onboardingGoal: null, onboardingTools: [], onboardingIntent: null, onboardingRequired: false },
      });
    });
  } catch (error) {
    if (error instanceof SupportSessionError) { fail(res, new AccountError(404, "NOT_FOUND", "Reader account not found")); return; }
    if (error instanceof AccountError) { fail(res, error); return; }
    throw error;
  }

  try { await removeSupportImages(supportImageKeys); }
  catch (error) { req.log?.error({ event: "support_cleanup_deferred", correlationId: res.locals.correlationId, errorName: error instanceof Error ? error.name : "UnknownError" }, "Private screenshot cleanup will be retried"); }
  res.clearCookie(READER_SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).send();
}
