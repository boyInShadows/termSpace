import { createHash } from "node:crypto";
import type { MarketplaceRole } from "@prisma/client";
import type { Request, RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { toPublicMarketplaceRole, type PublicMarketplaceRole } from "../lib/marketplaceRoles.js";

export const ADMIN_SESSION_COOKIE = "term_academy_session";
export const READER_SESSION_COOKIE = "term_academy_reader";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getAdminSession(req: Request) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 32) return null;

  return prisma.adminSession.findFirst({
    where: { tokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
    select: { id: true, user: { select: { id: true, email: true } } },
  });
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  return Boolean(await getAdminSession(req));
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Sign in with an administrator account" },
      });
      return;
    }

    res.locals.admin = session.user;
    next();
  } catch (error) {
    next(error);
  }
};

async function getReaderSession(req: Request) {
  const token = req.cookies?.[READER_SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 32) return null;
  return prisma.readerSession.findFirst({
    where: { tokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          marketplaceRoleGrants: {
            where: { revokedAt: null },
            select: { role: true },
          },
        },
      },
    },
  });
}

function readerAccess(user: {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  marketplaceRoleGrants: { role: MarketplaceRole }[];
}) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    marketplaceRoles: user.marketplaceRoleGrants.map(({ role }) => toPublicMarketplaceRole(role)),
  };
}

export const requireReader: RequestHandler = async (req, res, next) => {
  try {
    const session = await getReaderSession(req);
    if (!session) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in to sync your library" } });
      return;
    }
    res.locals.reader = readerAccess(session.user);
    res.locals.readerSessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireVerifiedReader: RequestHandler = (_req, res, next) => {
  if (!res.locals.reader?.emailVerified) {
    res.status(403).json({ error: { code: "EMAIL_VERIFICATION_REQUIRED", message: "Verify your email before creating a creator profile" } });
    return;
  }
  next();
};

export function requireMarketplaceRole(...allowedRoles: PublicMarketplaceRole[]): RequestHandler {
  if (!allowedRoles.length) throw new Error("requireMarketplaceRole requires at least one allowed role");
  const allowed = new Set(allowedRoles);

  return async (req, res, next) => {
    try {
      const session = await getReaderSession(req);
      if (!session) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in to access this marketplace area" } });
        return;
      }

      const reader = readerAccess(session.user);
      if (!reader.emailVerified) {
        res.status(403).json({ error: { code: "EMAIL_VERIFICATION_REQUIRED", message: "Verify your email before using creator or moderation tools" } });
        return;
      }

      if (!reader.marketplaceRoles.some((role) => allowed.has(role))) {
        res.status(403).json({ error: { code: "MARKETPLACE_ROLE_REQUIRED", message: "Your account does not have the required marketplace role" } });
        return;
      }

      res.locals.reader = reader;
      res.locals.readerSessionId = session.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
