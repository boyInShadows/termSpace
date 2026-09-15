import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEmailVerificationToken, verifyEmailVerificationToken, verificationUrl } from "./emailVerification.js";

describe("email verification tokens", () => {
  const previousSecret = process.env.EMAIL_VERIFICATION_SECRET;
  const previousUrl = process.env.WEB_PUBLIC_URL;

  beforeEach(() => {
    process.env.EMAIL_VERIFICATION_SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
    process.env.WEB_PUBLIC_URL = "https://termspace.example";
  });

  afterEach(() => {
    process.env.EMAIL_VERIFICATION_SECRET = previousSecret;
    process.env.WEB_PUBLIC_URL = previousUrl;
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
});
