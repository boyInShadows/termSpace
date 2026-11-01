import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * Newsletter membership lives on the subscriber row (shared with the public
 * sign-up form); moderation email is a reader column. Reading both in one
 * response keeps Settings from showing two loading states that can disagree.
 */
function readerEmail(res: Response) {
  return String(res.locals.reader.email).trim().toLowerCase();
}

async function readPreferences(res: Response) {
  const [subscriber, user] = await Promise.all([
    prisma.newsletterSubscriber.findUnique({
      where: { email: readerEmail(res) },
      select: { active: true },
    }),
    prisma.readerUser.findUnique({
      where: { id: String(res.locals.reader.id) },
      select: { notifyModerationEmail: true },
    }),
  ]);
  return {
    newsletter: subscriber?.active ?? false,
    // A missing row cannot happen for a live session; default on keeps the
    // promise the column was created with.
    moderation: user?.notifyModerationEmail ?? true,
  };
}

export async function getReaderPreferences(_req: Request, res: Response) {
  res.json({ data: await readPreferences(res) });
}

export async function updateReaderPreferences(req: Request, res: Response) {
  const email = readerEmail(res);
  const { newsletter, moderation } = req.body as { newsletter?: boolean; moderation?: boolean };

  if (newsletter !== undefined) {
    if (newsletter) {
      // Keep the original subscribedAt: this is the same subscription, resumed.
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        create: { email },
        update: { active: true },
      });
    } else {
      // Never write a row for someone who was never on the list.
      await prisma.newsletterSubscriber.updateMany({ where: { email, active: true }, data: { active: false } });
    }
  }

  if (moderation !== undefined) {
    await prisma.readerUser.update({
      where: { id: String(res.locals.reader.id) },
      data: { notifyModerationEmail: moderation },
    });
  }

  res.json({ data: await readPreferences(res) });
}
