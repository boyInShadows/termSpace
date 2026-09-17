import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Prisma, type MarketplaceRole } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { hashSessionToken, READER_SESSION_COOKIE } from "../middleware/auth.js";
import { toPublicMarketplaceRole } from "../lib/marketplaceRoles.js";
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_RESEND_LIMIT,
  EMAIL_VERIFICATION_RESEND_WINDOW_MS,
  localEmailVerificationBypassEnabled,
  newVerificationData,
  verifyEmailVerificationToken,
} from "../lib/emailVerification.js";

const sessionDays = Math.max(1, Number(process.env.READER_SESSION_DAYS ?? 30));
const googleClient = new OAuth2Client();
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: sessionDays * 24 * 60 * 60 * 1000,
});

type ReaderAccessUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  marketplaceRoleGrants: { role: MarketplaceRole }[];
};

const activeMarketplaceRoles = {
  where: { revokedAt: null },
  select: { role: true },
} as const;

function publicReader(user: ReaderAccessUser) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    marketplaceRoles: user.marketplaceRoleGrants.map(({ role }) => toPublicMarketplaceRole(role)),
  };
}

async function createSession(res: Response, user: ReaderAccessUser) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + cookieOptions().maxAge);
  await prisma.$transaction([
    prisma.readerSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    prisma.readerSession.create({ data: { tokenHash: hashSessionToken(token), expiresAt, userId: user.id } }),
  ]);
  res.cookie(READER_SESSION_COOKIE, token, cookieOptions());
  res.json({ data: { authenticated: true, user: publicReader(user), expiresAt } });
}

export async function loginReader(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();
  let user = await prisma.readerUser.findUnique({
    where: { email },
    include: { marketplaceRoleGrants: activeMarketplaceRoles },
  });
  if (!user?.passwordHash || !(await compare(String(req.body.password), user.passwordHash))) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    return;
  }
  if (!user.emailVerifiedAt && localEmailVerificationBypassEnabled()) {
    user = await prisma.readerUser.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      include: { marketplaceRoleGrants: activeMarketplaceRoles },
    });
  }
  await createSession(res, user);
}

export async function registerReader(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();
  const passwordHash = await hash(String(req.body.password), 12);
  const autoVerify = localEmailVerificationBypassEnabled();

  try {
    const user = await prisma.readerUser.create({
      data: autoVerify
        ? { email, passwordHash, emailVerifiedAt: new Date() }
        : { email, passwordHash, emailVerifications: { create: newVerificationData() } },
      select: { id: true, email: true, emailVerifiedAt: true, marketplaceRoleGrants: activeMarketplaceRoles },
    });
    await createSession(res, user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: { code: "EMAIL_ALREADY_REGISTERED", message: "An account with this email already exists" } });
      return;
    }
    throw error;
  }
}

export async function requestReaderEmailVerification(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const genericResponse = { data: { accepted: true } };
  if (res.locals.reader.emailVerified) {
    res.status(202).json(genericResponse);
    return;
  }

  const correlationId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - EMAIL_VERIFICATION_RESEND_WINDOW_MS);
    const [mostRecent, recentCount] = await Promise.all([
      tx.readerEmailVerification.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      tx.readerEmailVerification.count({ where: { userId, createdAt: { gte: windowStart } } }),
    ]);
    if ((mostRecent && mostRecent.createdAt > new Date(now.getTime() - EMAIL_VERIFICATION_RESEND_COOLDOWN_MS)) || recentCount >= EMAIL_VERIFICATION_RESEND_LIMIT) return null;

    const data = newVerificationData(now);
    await tx.transactionalEmailOutbox.updateMany({
      where: { verification: { userId }, status: { in: ["PENDING", "PROCESSING", "RETRY"] } },
      data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "SUPERSEDED" },
    });
    await tx.readerEmailVerification.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
    await tx.readerEmailVerification.create({ data: { userId, ...data } });
    return data.outbox.create.correlationId;
  });
  if (correlationId) req.log?.info({ correlationId }, "Email verification queued");
  res.status(202).json(genericResponse);
}

export async function confirmReaderEmailVerification(req: Request, res: Response) {
  const token = String(req.body.token);
  const id = token.slice(0, token.indexOf("."));
  const verification = id ? await prisma.readerEmailVerification.findUnique({
    where: { id },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true, user: { select: { emailVerifiedAt: true } } },
  }) : null;
  if (!verification || verification.user.emailVerifiedAt || verification.consumedAt || verification.expiresAt <= new Date() || !verifyEmailVerificationToken(token, verification)) {
    res.status(400).json({ error: { code: "INVALID_OR_EXPIRED_VERIFICATION", message: "This verification link is invalid or expired" } });
    return;
  }

  const now = new Date();
  const verified = await prisma.$transaction(async (tx) => {
    const consumed = await tx.readerEmailVerification.updateMany({
      where: { id: verification.id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) return false;
    await tx.readerUser.update({ where: { id: verification.userId }, data: { emailVerifiedAt: now } });
    await tx.readerEmailVerification.updateMany({
      where: { userId: verification.userId, id: { not: verification.id }, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.transactionalEmailOutbox.updateMany({
      where: { verification: { userId: verification.userId }, status: { in: ["PENDING", "PROCESSING", "RETRY"] } },
      data: { status: "CANCELLED", lockedAt: null, lastErrorCode: "ACCOUNT_VERIFIED" },
    });
    return true;
  });
  if (!verified) {
    res.status(400).json({ error: { code: "INVALID_OR_EXPIRED_VERIFICATION", message: "This verification link is invalid or expired" } });
    return;
  }
  res.json({ data: { verified: true } });
}

export async function loginReaderWithGoogle(req: Request, res: Response) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: { code: "GOOGLE_NOT_CONFIGURED", message: "Google sign-in is not configured" } });
    return;
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: clientId });
    payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new Error("Unverified Google account");
  } catch (error) {
    req.log?.warn({ err: error }, "Google credential rejected");
    res.status(401).json({ error: { code: "INVALID_GOOGLE_CREDENTIAL", message: "Google sign-in could not be verified" } });
    return;
  }

  const email = payload.email.toLowerCase();
  try {
    let user = await prisma.readerUser.findFirst({
      where: { OR: [{ googleSubject: payload.sub }, { email }] },
      select: { id: true, email: true, googleSubject: true, emailVerifiedAt: true, marketplaceRoleGrants: activeMarketplaceRoles },
    });
    if (user) {
      if (user.googleSubject && user.googleSubject !== payload.sub) {
        res.status(401).json({ error: { code: "INVALID_GOOGLE_CREDENTIAL", message: "Google sign-in could not be verified" } });
        return;
      }
      if (!user.googleSubject) {
        const [linkedUser] = await prisma.$transaction([
          prisma.readerUser.update({
            where: { id: user.id },
            data: { googleSubject: payload.sub, emailVerifiedAt: new Date(), passwordHash: null },
            select: { id: true, email: true, googleSubject: true, emailVerifiedAt: true, marketplaceRoleGrants: activeMarketplaceRoles },
          }),
          prisma.readerSession.deleteMany({ where: { userId: user.id } }),
        ]);
        user = linkedUser;
      } else if (!user.emailVerifiedAt) {
        user = await prisma.readerUser.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
          select: { id: true, email: true, googleSubject: true, emailVerifiedAt: true, marketplaceRoleGrants: activeMarketplaceRoles },
        });
      }
    } else {
      user = await prisma.readerUser.create({
        data: { email, googleSubject: payload.sub, emailVerifiedAt: new Date() },
        select: { id: true, email: true, googleSubject: true, emailVerifiedAt: true, marketplaceRoleGrants: activeMarketplaceRoles },
      });
    }
    await createSession(res, user);
  } catch (error) {
    req.log?.error({ err: error }, "Google sign-in persistence failed");
    throw error;
  }
}

export async function logoutReader(req: Request, res: Response) {
  const token = req.cookies?.[READER_SESSION_COOKIE];
  if (typeof token === "string") await prisma.readerSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  res.clearCookie(READER_SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(204).send();
}

export function getReaderSession(_req: Request, res: Response) {
  res.json({ data: { authenticated: true, user: res.locals.reader } });
}

export async function getReaderProfile(_req: Request, res: Response) {
  const user = await prisma.readerUser.findUnique({
    where: { id: res.locals.reader.id as string },
    select: { email: true, createdAt: true, passwordHash: true, googleSubject: true, emailVerifiedAt: true },
  });
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Reader account not found" } });
    return;
  }
  res.json({
    data: {
      email: user.email,
      createdAt: user.createdAt,
      hasPassword: Boolean(user.passwordHash),
      connectedGoogle: Boolean(user.googleSubject),
      emailVerified: Boolean(user.emailVerifiedAt),
    },
  });
}

export async function changeReaderPassword(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const user = await prisma.readerUser.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Reader account not found" } });
    return;
  }
  if (!user.passwordHash) {
    res.status(403).json({ error: { code: "PASSWORD_SETUP_REQUIRES_REAUTH", message: "Sign in again with Google before adding a password" } });
    return;
  }
  if (user.passwordHash) {
    if (!req.body.currentPassword) {
      res.status(400).json({ error: { code: "CURRENT_PASSWORD_REQUIRED", message: "Enter your current password" } });
      return;
    }
    if (!(await compare(String(req.body.currentPassword), user.passwordHash))) {
      res.status(401).json({ error: { code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect" } });
      return;
    }
    if (await compare(String(req.body.newPassword), user.passwordHash)) {
      res.status(400).json({ error: { code: "PASSWORD_UNCHANGED", message: "Choose a different password" } });
      return;
    }
  }

  const passwordHash = await hash(String(req.body.newPassword), 12);
  await prisma.$transaction([
    prisma.readerUser.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.readerSession.deleteMany({
      where: { userId, id: { not: res.locals.readerSessionId as string } },
    }),
  ]);
  res.json({ data: { updated: true } });
}

const articleSelect = { id: true, slug: true, title: true, excerpt: true, heroImage: true, publishedAt: true } as const;

export async function getReaderLibrary(_req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const [bookmarks, history] = await Promise.all([
    prisma.readerBookmark.findMany({ where: { userId, article: { published: true } }, orderBy: { createdAt: "desc" }, select: { createdAt: true, article: { select: articleSelect } } }),
    prisma.readerReadingProgress.findMany({ where: { userId, article: { published: true } }, orderBy: { visitedAt: "desc" }, select: { percentage: true, visitedAt: true, article: { select: articleSelect } } }),
  ]);
  res.json({ data: { bookmarks, history } });
}

async function publishedArticle(slug: string) {
  return prisma.article.findFirst({ where: { slug, published: true }, select: { id: true } });
}

export async function addBookmark(req: Request, res: Response) {
  const article = await publishedArticle(String(req.params.slug));
  if (!article) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } }); return; }
  await prisma.readerBookmark.upsert({ where: { userId_articleId: { userId: res.locals.reader.id, articleId: article.id } }, create: { userId: res.locals.reader.id, articleId: article.id }, update: {} });
  res.status(204).send();
}

export async function removeBookmark(req: Request, res: Response) {
  const article = await publishedArticle(String(req.params.slug));
  if (article) await prisma.readerBookmark.deleteMany({ where: { userId: res.locals.reader.id, articleId: article.id } });
  res.status(204).send();
}

export async function saveProgress(req: Request, res: Response) {
  const article = await publishedArticle(String(req.params.slug));
  if (!article) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } }); return; }
  const data = { percentage: req.body.percentage, visitedAt: new Date() };
  await prisma.readerReadingProgress.upsert({ where: { userId_articleId: { userId: res.locals.reader.id, articleId: article.id } }, create: { userId: res.locals.reader.id, articleId: article.id, ...data }, update: data });
  res.status(204).send();
}

export async function syncReaderLibrary(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const entries = [...req.body.bookmarks, ...req.body.history] as { slug: string; progress: number; visitedAt?: string }[];
  const articles = await prisma.article.findMany({ where: { slug: { in: entries.map((item) => item.slug) }, published: true }, select: { id: true, slug: true } });
  const ids = new Map(articles.map((article) => [article.slug, article.id]));
  const existingProgress = await prisma.readerReadingProgress.findMany({
    where: { userId, articleId: { in: articles.map((article) => article.id) } },
    select: { articleId: true, visitedAt: true },
  });
  const existingVisits = new Map(existingProgress.map((item) => [item.articleId, item.visitedAt]));
  const operations = [
    ...req.body.bookmarks.flatMap((item: { slug: string }) => ids.has(item.slug) ? [prisma.readerBookmark.upsert({ where: { userId_articleId: { userId, articleId: ids.get(item.slug)! } }, create: { userId, articleId: ids.get(item.slug)! }, update: {} })] : []),
    ...req.body.history.flatMap((item: { slug: string; progress: number; visitedAt?: string }) => {
      const articleId = ids.get(item.slug);
      if (!articleId) return [];
      const visitedAt = item.visitedAt ? new Date(item.visitedAt) : new Date();
      const existingVisit = existingVisits.get(articleId);
      if (existingVisit && existingVisit >= visitedAt) return [];
      return [prisma.readerReadingProgress.upsert({
        where: { userId_articleId: { userId, articleId } },
        create: { userId, articleId, percentage: item.progress, visitedAt },
        update: { percentage: item.progress, visitedAt },
      })];
    }),
  ];
  if (operations.length) await prisma.$transaction(operations);
  res.json({ data: { synced: operations.length } });
}
