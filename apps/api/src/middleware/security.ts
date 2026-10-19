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

const trustsProxy = () => Boolean(process.env.TRUST_PROXY) && process.env.TRUST_PROXY !== "0";
/** Server-side calls from the frontends carry no X-Forwarded-For (see apiRateLimit). */
const internalCall = (req: { headers: Record<string, unknown> }) => trustsProxy() && !req.headers["x-forwarded-for"];

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Browser traffic reaches the API through the frontends' /backend proxy, which
  // always sends X-Forwarded-For. Server-rendered pages call the API directly from
  // the frontend containers without it; behind a trusted proxy those would all share
  // one client IP and exhaust this limit for every visitor, so they are not counted.
  // The API port is bound to loopback in docker-compose.yml.
  skip: (req) => req.path === "/api/health" || internalCall(req),
  message: rateLimitResponse,
});

// One counter per endpoint: sharing one instance lets a few failed sign-ins (or a
// shared NAT address) lock a user out of registering or changing a password.
// ponytail: per IP only, in memory. Add a per-account lockout and a shared store
// (Redis/Postgres) before running more than one API replica.
const authRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});
export const loginRateLimit = authRateLimit();
export const adminLoginRateLimit = authRateLimit();
export const registerRateLimit = authRateLimit();
export const googleSignInRateLimit = authRateLimit();
export const passwordChangeRateLimit = authRateLimit();
export const authRateLimiters = [loginRateLimit, adminLoginRateLimit, registerRateLimit, googleSignInRateLimit, passwordChangeRateLimit];

/**
 * Text search runs LIKE/full-text scans, so it gets a tighter budget than plain browsing.
 * Server-rendered search pages must forward the visitor's X-Forwarded-For, or they go uncounted.
 */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => (!req.query.q && !req.query.search) || internalCall(req),
  message: rateLimitResponse,
});

export const reviewWriteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
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

export const passwordResetRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => { res.status(202).json({ data: { accepted: true } }); },
});

export const passwordResetAttemptRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
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
