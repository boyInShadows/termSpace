import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * The newsletter list is the only subscription store and it is keyed by the
 * account email, so Settings and the public sign-up form cannot disagree.
 * There is no per-user preference row: an absent subscriber is simply off.
 */
function readerEmail(res: Response) {
  return String(res.locals.reader.email).trim().toLowerCase();
}

export async function getReaderPreferences(_req: Request, res: Response) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: readerEmail(res) },
    select: { active: true },
  });

  res.json({ data: { newsletter: subscriber?.active ?? false } });
}

export async function updateReaderPreferences(req: Request, res: Response) {
  const email = readerEmail(res);
  const newsletter = Boolean(req.body.newsletter);

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

  res.json({ data: { newsletter } });
}
