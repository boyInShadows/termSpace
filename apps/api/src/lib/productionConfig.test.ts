import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertProductionConfig } from "./productionConfig.js";

const valid = () => ({
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://app:s3cure-pass@db:5432/app",
  CORS_ORIGINS: "https://example.org",
  REDIS_URL: "redis://redis:6379",
  EMAIL_VERIFICATION_SECRET: randomBytes(32).toString("hex"),
  MARKETPLACE_PROVIDER_TOKEN_KEY: randomBytes(32).toString("base64"),
  LOCAL_AUTO_VERIFY_EMAIL: "",
});

function stub(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...valid(), ...overrides })) vi.stubEnv(key, value);
}

describe("assertProductionConfig", () => {
  beforeEach(() => stub());
  afterEach(() => vi.unstubAllEnvs());

  it("passes with a complete production config", () => {
    expect(() => assertProductionConfig()).not.toThrow();
  });

  it("does nothing outside production", () => {
    stub({ NODE_ENV: "development", DATABASE_URL: "postgresql://change-this@db/app", EMAIL_VERIFICATION_SECRET: "" });
    expect(() => assertProductionConfig()).not.toThrow();
  });

  it.each([
    ["a placeholder DATABASE_URL", { DATABASE_URL: "postgresql://app:change-this-database-password@db/app" }, /placeholder/],
    ["no CORS_ORIGINS", { CORS_ORIGINS: "" }, /CORS_ORIGINS/],
    ["no REDIS_URL", { REDIS_URL: "" }, /REDIS_URL/],
    ["the local email bypass", { LOCAL_AUTO_VERIFY_EMAIL: "true" }, /LOCAL_AUTO_VERIFY_EMAIL/],
    ["a short email secret", { EMAIL_VERIFICATION_SECRET: "short" }, /EMAIL_VERIFICATION_SECRET/],
    ["no provider token key", { MARKETPLACE_PROVIDER_TOKEN_KEY: "" }, /MARKETPLACE_PROVIDER_TOKEN_KEY/],
  ])("refuses %s", (_name, overrides, message) => {
    stub(overrides);
    expect(() => assertProductionConfig()).toThrow(message);
  });
});
