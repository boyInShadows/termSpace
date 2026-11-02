import type { Request, Response } from "express";
import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { readerOnboardingSchema } from "../validation/schemas.js";

const selection = {
  onboardingRequired: true, onboardingRole: true, onboardingGoal: true, onboardingTools: true, onboardingIntent: true,
} as const;

function answers(user: { onboardingRequired: boolean; onboardingRole: string | null; onboardingGoal: string | null; onboardingTools: string[]; onboardingIntent: string | null }) {
  return { required: user.onboardingRequired, role: user.onboardingRole, goal: user.onboardingGoal, tools: user.onboardingTools, intent: user.onboardingIntent };
}

export async function getReaderOnboarding(_req: Request, res: Response) {
  const user = await prisma.readerUser.findUnique({ where: { id: String(res.locals.reader.id) }, select: selection });
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Reader account not found" } });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: answers(user) });
}

export async function saveReaderOnboarding(req: Request, res: Response) {
  const { role, goal, tools, intent } = req.body as z.infer<typeof readerOnboardingSchema>;
  const user = await prisma.readerUser.update({
    where: { id: String(res.locals.reader.id) },
    data: { onboardingRole: role, onboardingGoal: goal, onboardingTools: tools, onboardingIntent: intent, onboardingRequired: false },
    select: selection,
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: answers(user) });
}
