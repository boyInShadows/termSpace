import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

// Refuse to overwrite keys: doing so invalidates links and encrypted provider tokens.
const file = process.argv[2];
if (!file) throw new Error("Usage: node deploy/init-preview.mjs /protected/path/preview.env");
const origin = "https://termspace.localhost:8443";
const config = {
  DEPLOYMENT_MODE: "preview", NODE_ENV: "production",
  POSTGRES_USER: "termspace", POSTGRES_DB: "termspace",
  POSTGRES_PASSWORD: randomBytes(32).toString("hex"),
  EMAIL_VERIFICATION_SECRET: randomBytes(48).toString("base64"),
  MARKETPLACE_PROVIDER_TOKEN_KEY: randomBytes(32).toString("base64"),
  WEB_PUBLIC_URL: origin, NEXT_PUBLIC_SITE_URL: origin, CORS_ORIGINS: origin,
  MEDIA_PUBLIC_URL: `${origin}/backend/media`, NEXT_PUBLIC_API_URL: "/backend", TRUST_PROXY: "1",
  LOCAL_AUTO_VERIFY_EMAIL: "false", SEED_DEMO: "false", SEED_RESET: "false", NEXT_PUBLIC_USE_MOCK: "",
  GOOGLE_CLIENT_ID: "", NEXT_PUBLIC_BLOG_URL: "", LEGAL_ENTITY_NAME: "TermSpace", LEGAL_CONTACT_EMAIL: "",
  CLOUDFLARE_ACCOUNT_ID: "", CLOUDFLARE_EMAIL_API_TOKEN: "", EMAIL_FROM_ADDRESS: "",
  WEB_IMAGE: "", API_IMAGE: "", OPS_IMAGE: "",
};
try {
  await writeFile(file, Object.entries(config).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n") + "\n", { mode: 0o600, flag: "wx" });
  console.log("Private preview configuration created with new secrets. Set the verified release image digests before deployment.");
} catch (error) {
  console.error(`Configuration not created (${error.code ?? "unknown error"}); existing files are never overwritten.`);
  process.exitCode = 1;
}
