import { randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_RESEND_LIMIT,
  EMAIL_VERIFICATION_RESEND_WINDOW_MS,
  newEmailChangeData,
  verifyEmailChangeToken,
} from "../lib/emailVerification.js";

const error = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });

/**
 * Starts a change by mailing a confirmation link to the new address. Nothing changes
 * until that link is opened, and an address that is already taken looks the same as
 * one that was accepted, so this cannot be used to discover who has an account.
 */
export async function requestReaderEmailChange(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  const { newEmail, currentPassword } = req.body as { newEmail: string; currentPassword: string };
  const user = await prisma.readerUser.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true, deletedAt: true } });
  if (!user || user.deletedAt) return error(res, 404, "NOT_FOUND", "Reader account not found");
  // A Google-only account's address is the one Google vouches for.
  if (!user.passwordHash) return error(res, 403, "EMAIL_CHANGE_REQUIRES_PASSWORD", "This account signs in with Google, so its email address cannot be changed here");
  if (!(await compare(currentPassword, user.passwordHash))) return error(res, 401, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  if (newEmail === user.email) return error(res, 400, "EMAIL_UNCHANGED", "Enter a different email address");

  const now = new Date();
  const recent = await prisma.readerEmailChange.findMany({
    where: { userId, createdAt: { gte: new Date(now.getTime() - EMAIL_VERIFICATION_RESEND_WINDOW_MS) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < EMAIL_VERIFICATION_RESEND_COOLDOWN_MS) {
    return error(res, 429, "EMAIL_CHANGE_COOLDOWN", "Wait a minute before asking again");
  }
  if (recent.length >= EMAIL_VERIFICATION_RESEND_LIMIT) return error(res, 429, "EMAIL_CHANGE_LIMIT", "Too many email change requests. Try again later");

  if (!(await prisma.readerUser.findUnique({ where: { email: newEmail }, select: { id: true } }))) {
    await prisma.$transaction([
      // An earlier unopened link stops working as soon as a newer one exists.
      prisma.readerEmailChange.updateMany({ where: { userId, consumedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
      prisma.readerEmailChange.create({ data: { userId, ...newEmailChangeData(newEmail, now) } }),
    ]);
  }
  res.status(202).json({ data: { accepted: true } });
}

/**
 * Applies a confirmed change: the new address becomes the verified sign-in email,
 * every session ends, and the old address is told. The link is the proof, so this
 * works from any browser.
 */
export async function confirmReaderEmailChange(req: Request, res: Response) {
  const token = String(req.body.token);
  const id = token.slice(0, Math.max(token.indexOf("."), 0));
  const change = id
    ? await prisma.readerEmailChange.findUnique({
      where: { id },
      select: { id: true, userId: true, newEmail: true, expiresAt: true, consumedAt: true, user: { select: { email: true, deletedAt: true } } },
    })
    : null;
  const now = new Date();
  if (!change || change.consumedAt || change.expiresAt <= now || change.user.deletedAt || !verifyEmailChangeToken(token, change)) {
    return error(res, 400, "INVALID_OR_EXPIRED_EMAIL_CHANGE", "This confirmation link is invalid or has expired");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.readerEmailChange.updateMany({ where: { id: change.id, consumedAt: null }, data: { consumedAt: now, previousEmail: change.user.email } });
      if (claimed.count !== 1) throw new Error("EMAIL_CHANGE_ALREADY_USED");
      await tx.readerUser.update({ where: { id: change.userId }, data: { email: change.newEmail, emailVerifiedAt: now } });
      await tx.readerSession.deleteMany({ where: { userId: change.userId } });
      await tx.transactionalEmailOutbox.create({ data: { correlationId: randomUUID(), emailChangeNoticeId: change.id } });
    });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") {
      return error(res, 409, "EMAIL_UNAVAILABLE", "That email address is already in use");
    }
    if (cause instanceof Error && cause.message === "EMAIL_CHANGE_ALREADY_USED") {
      return error(res, 400, "INVALID_OR_EXPIRED_EMAIL_CHANGE", "This confirmation link is invalid or has expired");
    }
    throw cause;
  }
  res.json({ data: { changed: true } });
}
