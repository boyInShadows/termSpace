import { afterEach, describe, expect, it } from "vitest";
import { decryptProviderToken, encryptProviderToken } from "./marketplaceProviderToken.js";

const originalKey = process.env.MARKETPLACE_PROVIDER_TOKEN_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.MARKETPLACE_PROVIDER_TOKEN_KEY;
  else process.env.MARKETPLACE_PROVIDER_TOKEN_KEY = originalKey;
});

describe("marketplace provider token encryption", () => {
  it("round-trips a token without storing plaintext", () => {
    process.env.MARKETPLACE_PROVIDER_TOKEN_KEY = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptProviderToken("github_pat_secret-value");
    expect(encrypted.encryptedToken).not.toContain("secret-value");
    expect(decryptProviderToken(encrypted)).toBe("github_pat_secret-value");
  });

  it("rejects malformed encryption keys", () => {
    process.env.MARKETPLACE_PROVIDER_TOKEN_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encryptProviderToken("token-value")).toThrow(/exactly 32 bytes/);
  });
});
