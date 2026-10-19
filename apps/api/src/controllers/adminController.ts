import { randomBytes } from "node:crypto";
import { comparePassword } from "../lib/passwordCompare.js";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ADMIN_SESSION_COOKIE, hashSessionToken } from "../middleware/auth.js";

const sessionHours = Math.max(1, Number(process.env.ADMIN_SESSION_HOURS ?? 24));

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionHours * 60 * 60 * 1000,
  };
}

export async function loginAdmin(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = await comparePassword(String(req.body.password), user?.passwordHash);

  if (!user || !valid) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const maxAge = cookieOptions().maxAge;
  const expiresAt = new Date(Date.now() + maxAge);
  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    prisma.adminSession.create({
      data: { tokenHash: hashSessionToken(token), expiresAt, userId: user.id },
    }),
  ]);

  res.cookie(ADMIN_SESSION_COOKIE, token, cookieOptions());
  res.json({ data: { authenticated: true, user: { email: user.email }, expiresAt } });
}

export async function logoutAdmin(req: Request, res: Response) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token === "string") {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  res.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).send();
}

export function getAdminSession(_req: Request, res: Response) {
  res.json({ data: { authenticated: true, user: res.locals.admin } });
}
