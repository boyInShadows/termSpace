import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateConfig, readConfig } from "./check-config.mjs";

const image = `ghcr.io/boyinshadows/termspace-api@sha256:${"a".repeat(64)}`;
const valid = () => ({
  DEPLOYMENT_MODE: "preview", NODE_ENV: "production", WEB_IMAGE: image, API_IMAGE: image, OPS_IMAGE: image,
  POSTGRES_USER: "termspace", POSTGRES_DB: "termspace", POSTGRES_PASSWORD: randomBytes(32).toString("hex"),
  EMAIL_VERIFICATION_SECRET: randomBytes(48).toString("base64"), MARKETPLACE_PROVIDER_TOKEN_KEY: randomBytes(32).toString("base64"),
  WEB_PUBLIC_URL: "https://termspace.localhost:8443", NEXT_PUBLIC_SITE_URL: "https://termspace.localhost:8443",
  CORS_ORIGINS: "https://termspace.localhost:8443", MEDIA_PUBLIC_URL: "https://termspace.localhost:8443/backend/media",
  NEXT_PUBLIC_API_URL: "/backend", TRUST_PROXY: "1",
});
test("private preview permits undecided mail/contact without weakening secrets or authentication", () => assert.deepEqual(validateConfig(valid()), []));

test("public preview permits external HTTPS without claiming mail-enabled launch", () => {
  const origin = "https://termspace.13.140.89.146.sslip.io";
  const env = { ...valid(), DEPLOYMENT_MODE: "public-preview", WEB_PUBLIC_URL: origin, NEXT_PUBLIC_SITE_URL: origin, CORS_ORIGINS: origin, MEDIA_PUBLIC_URL: `${origin}/backend/media` };
  assert.deepEqual(validateConfig(env), []);
  for (const invalidOrigin of ["http://termspace.13.140.89.146.sslip.io", "https://localhost", "https://127.0.0.1", "https://[::1]"]) {
    const errors = validateConfig({ ...env, WEB_PUBLIC_URL: invalidOrigin, NEXT_PUBLIC_SITE_URL: invalidOrigin, CORS_ORIGINS: invalidOrigin, MEDIA_PUBLIC_URL: `${invalidOrigin}/backend/media` });
    assert.ok(errors.some((error) => error.startsWith("WEB_PUBLIC_URL:")), invalidOrigin);
  }
  for (const [key, value] of Object.entries({ POSTGRES_PASSWORD: "bad-secret", CORS_ORIGINS: "*", LOCAL_AUTO_VERIFY_EMAIL: "true", WEB_IMAGE: "ghcr.io/boyinshadows/termspace-web:latest", CLOUDFLARE_EMAIL_API_TOKEN: "partial-mail-token" })) {
    assert.ok(validateConfig({ ...env, [key]: value }).length, key);
  }
  assert.ok(validateConfig({ ...env, DEPLOYMENT_MODE: "public" }).some((error) => error.startsWith("LEGAL_CONTACT_EMAIL:")));
  assert.ok(validateConfig({ ...env, DEPLOYMENT_MODE: "public" }).some((error) => error.startsWith("CLOUDFLARE_EMAIL_API_TOKEN:")));
});
test("unsafe settings and partial mail configuration are rejected without exposing values", () => {
  for (const [key, value] of Object.entries({ NODE_ENV: "development", DEPLOYMENT_MODE: "unknown", NEXT_PUBLIC_USE_MOCK: "1", LOCAL_AUTO_VERIFY_EMAIL: "true", SEED_DEMO: "true", SEED_RESET: "true", POSTGRES_PASSWORD: "secret-example-password", MARKETPLACE_PROVIDER_TOKEN_KEY: "invalid-secret", WEB_IMAGE: "ghcr.io/example/image:latest", CORS_ORIGINS: "*", WEB_PUBLIC_URL: "http://localhost:3000", NEXT_PUBLIC_API_URL: "http://api:4001", CLOUDFLARE_EMAIL_API_TOKEN: "private-test-token" })) {
    const errors = validateConfig({ ...valid(), [key]: value });
    assert.ok(errors.length, key);
    assert.ok(!errors.join("\n").includes(value), key);
  }
});
test("public launch requires a real origin, complete mail settings and a contact", () => {
  const env = { ...valid(), DEPLOYMENT_MODE: "public" };
  assert.ok(validateConfig(env).some((error) => error.startsWith("LEGAL_CONTACT_EMAIL:")));
  const origin = "https://termspace.test";
  assert.deepEqual(validateConfig({ ...env, WEB_PUBLIC_URL: origin, NEXT_PUBLIC_SITE_URL: origin, CORS_ORIGINS: origin, MEDIA_PUBLIC_URL: `${origin}/backend/media`, LEGAL_CONTACT_EMAIL: "privacy@termspace.test", CLOUDFLARE_ACCOUNT_ID: "test-account", CLOUDFLARE_EMAIL_API_TOKEN: "private-test-token", EMAIL_FROM_ADDRESS: "accounts@termspace.test" }), []);
});
test("configuration files cannot be symlinks or group/world readable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "termspace-config-"));
  try {
    const file = join(directory, "config");
    await writeFile(file, "NODE_ENV=production", { mode: 0o644 });
    await assert.rejects(readConfig(file), /mode 600/);
  } finally { await rm(directory, { recursive: true }); }
});
