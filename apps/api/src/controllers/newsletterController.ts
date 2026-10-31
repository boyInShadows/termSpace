import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function subscribeToNewsletter(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();

  try {
    // A previously unsubscribed address may subscribe again; Settings shows the same row.
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { active: true },
    });
    res.status(202).json({ data: { submitted: true } });
  } catch (err) {
    // Two concurrent sign-ups for the same address still resolve to one active row.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(202).json({ data: { submitted: true } });
      return;
    }

    throw err;
  }
}
