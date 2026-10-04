import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 60 * 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_LIMIT = 5;
export const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;
export const PASSWORD_RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
export const PASSWORD_RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_REQUEST_LIMIT = 5;
export const PASSWORD_RESET_ATTEMPT_LIMIT = 5;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function localEmailVerificationBypassEnabled(): boolean {
  if (process.env.LOCAL_AUTO_VERIFY_EMAIL !== "true") return false;

  const configured = process.env.WEB_PUBLIC_URL;
  if (!configured) {
    throw new Error("LOCAL_AUTO_VERIFY_EMAIL requires an explicit loopback WEB_PUBLIC_URL");
  }

  let publicUrl: URL;
  try {
    publicUrl = new URL(configured);
  } catch {
    throw new Error("LOCAL_AUTO_VERIFY_EMAIL requires a valid loopback WEB_PUBLIC_URL");
  }

  if (!LOCAL_HOSTNAMES.has(publicUrl.hostname)) {
    throw new Error("LOCAL_AUTO_VERIFY_EMAIL is restricted to loopback WEB_PUBLIC_URL hosts");
  }

  return true;
}

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

function passwordResetDigest(fields: VerificationFields): Buffer {
  return createHmac("sha256", verificationSecret())
    .update(`password-reset.${fields.id}.${fields.userId}.${fields.expiresAt.getTime()}`)
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

export function createPasswordResetCode(fields: VerificationFields): string {
  return String(passwordResetDigest(fields).readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function verifyPasswordResetCode(code: string, fields: VerificationFields): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  return timingSafeEqual(Buffer.from(code), Buffer.from(createPasswordResetCode(fields)));
}

export function newPasswordResetData(now = new Date()) {
  return {
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
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
