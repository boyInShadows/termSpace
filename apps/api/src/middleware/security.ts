import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { ADMIN_SESSION_COOKIE, READER_SESSION_COOKIE } from "./auth.js";

const rateLimitResponse = {
  error: { code: "RATE_LIMITED", message: "Too many requests; please try again later" },
};

function configuredOrigins(): Set<string> {
  return new Set(
    (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

/**
 * Cookie-authenticated writes must originate from a configured frontend.
 * Requests without Origin/Referer are allowed for non-browser API clients.
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin") ?? (() => {
    const referer = req.get("referer");
    if (!referer) return undefined;
    try { return new URL(referer).origin; } catch { return "invalid"; }
  })();

  const hasSessionCookie = Boolean(req.cookies?.[ADMIN_SESSION_COOKIE] || req.cookies?.[READER_SESSION_COOKIE]);
  if ((hasSessionCookie && !origin) || (origin && !configuredOrigins().has(origin))) {
    res.status(403).json({ error: { code: "CSRF_ORIGIN_REJECTED", message: "Request origin is not allowed" } });
    return;
  }
  next();
};

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  message: rateLimitResponse,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const emailVerificationRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => { res.status(202).json({ data: { accepted: true } }); },
});

export const emailVerificationAttemptRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const newsletterRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const commentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});
