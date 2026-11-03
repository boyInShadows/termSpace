import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEmailVerificationToken, createPasswordResetToken, localEmailVerificationBypassEnabled, passwordResetUrl, verifyEmailVerificationToken, verifyPasswordResetToken, verificationUrl } from "./emailVerification.js";

describe("email verification tokens", () => {
  const previousSecret = process.env.EMAIL_VERIFICATION_SECRET;
  const previousUrl = process.env.WEB_PUBLIC_URL;
  const previousLocalBypass = process.env.LOCAL_AUTO_VERIFY_EMAIL;

  beforeEach(() => {
    process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
    process.env.WEB_PUBLIC_URL = "https://termspace.example";
  });

  afterEach(() => {
    process.env.EMAIL_VERIFICATION_SECRET = previousSecret;
    process.env.WEB_PUBLIC_URL = previousUrl;
    process.env.LOCAL_AUTO_VERIFY_EMAIL = previousLocalBypass;
  });

  it("signs database-backed fields without storing a bearer secret", () => {
    const fields = { id: "verification-1", userId: "reader-1", expiresAt: new Date("2026-09-15T12:30:00.000Z") };
    const token = createEmailVerificationToken(fields);
    expect(verifyEmailVerificationToken(token, fields)).toBe(true);
    expect(verifyEmailVerificationToken(token, { ...fields, userId: "reader-2" })).toBe(false);
    expect(token).not.toContain(process.env.EMAIL_VERIFICATION_SECRET!);
  });

  it("refuses the public .env.example placeholder as a signing secret", () => {
    process.env.EMAIL_VERIFICATION_SECRET = "replace-with-at-least-32-random-bytes";
    expect(() => createPasswordResetToken({ id: "reset-1", userId: "reader-1", expiresAt: new Date() })).toThrow(/placeholder/);
  });

  it("places the token in a URL fragment", () => {
    const url = verificationUrl("verification-1.signature");
    expect(url).toBe("https://termspace.example/account/verify-email#token=verification-1.signature");
    expect(new URL(url).search).toBe("");
  });

  it("derives a reset token bound to the reset row without storing it", () => {
    const fields = { id: "reset-1", userId: "reader-1", expiresAt: new Date("2026-09-15T12:30:00.000Z") };
    const token = createPasswordResetToken(fields);
    expect(verifyPasswordResetToken(token, fields)).toBe(true);
    expect(verifyPasswordResetToken(token, { ...fields, userId: "reader-2" })).toBe(false);
    expect(verifyPasswordResetToken(token, { ...fields, expiresAt: new Date("2026-09-15T12:31:00.000Z") })).toBe(false);
    expect(verifyPasswordResetToken("reset-2.signature", fields)).toBe(false);
    expect(token).not.toContain(process.env.EMAIL_VERIFICATION_SECRET!);
  });

  it("places the reset token in a URL fragment", () => {
    const url = passwordResetUrl("reset-1.signature");
    expect(url).toBe("https://termspace.example/account/reset-password#token=reset-1.signature");
    expect(new URL(url).search).toBe("");
  });

  it("allows the explicit local bypass only for loopback public URLs", () => {
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = "http://localhost:3100";
    expect(localEmailVerificationBypassEnabled()).toBe(true);

    process.env.WEB_PUBLIC_URL = "https://termspace.example";
    expect(() => localEmailVerificationBypassEnabled()).toThrow(/restricted to loopback/);
  });

  it("never enables the local bypass in production, even on a loopback URL", () => {
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = "http://localhost:3100";
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(localEmailVerificationBypassEnabled()).toBe(false);
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("keeps the local bypass disabled by default", () => {
    delete process.env.LOCAL_AUTO_VERIFY_EMAIL;
    expect(localEmailVerificationBypassEnabled()).toBe(false);
  });
});
