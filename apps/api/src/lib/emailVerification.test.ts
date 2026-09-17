import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEmailVerificationToken, localEmailVerificationBypassEnabled, verifyEmailVerificationToken, verificationUrl } from "./emailVerification.js";

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

  it("places the token in a URL fragment", () => {
    const url = verificationUrl("verification-1.signature");
    expect(url).toBe("https://termspace.example/account/verify-email#token=verification-1.signature");
    expect(new URL(url).search).toBe("");
  });

  it("allows the explicit local bypass only for loopback public URLs", () => {
    process.env.LOCAL_AUTO_VERIFY_EMAIL = "true";
    process.env.WEB_PUBLIC_URL = "http://localhost:3100";
    expect(localEmailVerificationBypassEnabled()).toBe(true);

    process.env.WEB_PUBLIC_URL = "https://termspace.example";
    expect(() => localEmailVerificationBypassEnabled()).toThrow(/restricted to loopback/);
  });

  it("keeps the local bypass disabled by default", () => {
    delete process.env.LOCAL_AUTO_VERIFY_EMAIL;
    expect(localEmailVerificationBypassEnabled()).toBe(false);
  });
});
