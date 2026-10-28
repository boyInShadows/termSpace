import rateLimit, { type Options } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import type { RequestHandler } from "express";
import { redis } from "../lib/redis.js";
import { ADMIN_SESSION_COOKIE, READER_SESSION_COOKIE } from "./auth.js";

const rateLimitResponse = {
  error: { code: "RATE_LIMITED", message: "Too many requests; please try again later" },
};

/**
 * Every limiter gets its own counter namespace. With Redis the counters are shared by
 * all API replicas; if Redis is unreachable requests pass uncounted instead of failing.
 */
function limiter(name: string, options: Partial<Options>) {
  const client = redis;
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: rateLimitResponse,
    ...(client && {
      store: new RedisStore({ prefix: `rl:${name}:`, sendCommand: (command: string, ...args: string[]) => client.call(command, ...args) as Promise<RedisReply> }),
      passOnStoreError: true,
    }),
    ...options,
  });
}

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

export const apiRateLimit = limiter("api", {
  windowMs: 15 * 60 * 1000,
  limit: 300,
  // Browser traffic reaches the API through the frontends' /backend proxy, which
  // always sends X-Forwarded-For. Server-rendered pages call the API directly from
  // the frontend containers without it; behind a trusted proxy those would all share
  // one client IP and exhaust this limit for every visitor, so they are not counted.
  // The API port is bound to loopback in docker-compose.yml.
  skip: (req) => req.path === "/api/health" || internalCall(req),
});

// One counter per endpoint: sharing one instance lets a few failed sign-ins (or a
// shared NAT address) lock a user out of registering or changing a password.
// ponytail: per IP only. Add a per-account lockout if credential stuffing shows up.
const authRateLimit = (name: string) => limiter(name, { windowMs: 15 * 60 * 1000, limit: 10 });
export const loginRateLimit = authRateLimit("login");
export const adminLoginRateLimit = authRateLimit("admin-login");
export const registerRateLimit = authRateLimit("register");
export const googleSignInRateLimit = authRateLimit("google");
export const passwordChangeRateLimit = authRateLimit("password-change");
export const accountExportRateLimit = authRateLimit("account-export");
export const accountDeleteRateLimit = authRateLimit("account-delete");
export const authRateLimiters = [loginRateLimit, adminLoginRateLimit, registerRateLimit, googleSignInRateLimit, passwordChangeRateLimit, accountExportRateLimit, accountDeleteRateLimit];

/**
 * Text search runs LIKE/full-text scans, so it gets a tighter budget than plain browsing.
 * Server-rendered search pages must forward the visitor's X-Forwarded-For, or they go uncounted.
 */
export const searchRateLimit = limiter("search", {
  windowMs: 60 * 1000,
  limit: 30,
  skip: (req) => (!req.query.q && !req.query.search) || internalCall(req),
});

const HOUR = 60 * 60 * 1000;
const accepted = (_req: unknown, res: { status(code: number): { json(body: unknown): void } }) => { res.status(202).json({ data: { accepted: true } }); };

export const reportWriteRateLimit = limiter("report-write", { windowMs: HOUR, limit: 20 });
export const reviewWriteRateLimit = limiter("review-write", { windowMs: HOUR, limit: 20 });
export const emailVerificationRequestRateLimit = limiter("email-verification-request", { windowMs: HOUR, limit: 12, handler: accepted });
export const emailVerificationAttemptRateLimit = limiter("email-verification-attempt", { windowMs: HOUR, limit: 12 });
export const passwordResetRequestRateLimit = limiter("password-reset-request", { windowMs: HOUR, limit: 5, handler: accepted });
export const passwordResetAttemptRateLimit = limiter("password-reset-attempt", { windowMs: HOUR, limit: 10 });
export const newsletterRateLimit = limiter("newsletter", { windowMs: HOUR, limit: 5 });
export const commentRateLimit = limiter("comment", { windowMs: HOUR, limit: 8 });
