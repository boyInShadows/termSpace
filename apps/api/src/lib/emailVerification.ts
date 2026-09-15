import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 60 * 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_LIMIT = 5;

type VerificationFields = {
  id: string;
  userId: string;
  expiresAt: Date;
};

function verificationSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("EMAIL_VERIFICATION_SECRET must contain at least 32 bytes");
  }
  return secret;
}

function signature(fields: VerificationFields): Buffer {
  return createHmac("sha256", verificationSecret())
    .update(`${fields.id}.${fields.userId}.${fields.expiresAt.getTime()}`)
    .digest();
}

export function createEmailVerificationToken(fields: VerificationFields): string {
  return `${fields.id}.${signature(fields).toString("base64url")}`;
}

export function verifyEmailVerificationToken(token: string, fields: VerificationFields): boolean {
  const separator = token.indexOf(".");
  if (separator < 1 || token.slice(0, separator) !== fields.id) return false;
  try {
    const supplied = Buffer.from(token.slice(separator + 1), "base64url");
    const expected = signature(fields);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  } catch {
    return false;
  }
}

export function newVerificationData(now = new Date()) {
  return {
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
    outbox: { create: { correlationId: randomUUID() } },
  };
}

export function verificationUrl(token: string): string {
  const configured = process.env.WEB_PUBLIC_URL ?? "http://localhost:3000";
  const base = new URL(configured);
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new Error("WEB_PUBLIC_URL must use HTTPS in production");
  }
  base.pathname = "/account/verify-email";
  base.search = "";
  base.hash = `token=${encodeURIComponent(token)}`;
  return base.toString();
}
