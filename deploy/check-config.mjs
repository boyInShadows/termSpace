import { readFile, lstat } from "node:fs/promises";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";

const placeholder = /replace-with|change-this|your-domain|example\.(com|org)|\.example(?:$|\/)/i;
const digest = /^ghcr\.io\/[a-z0-9/_.-]+@sha256:[a-f0-9]{64}$/;
const mailKeys = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_EMAIL_API_TOKEN", "EMAIL_FROM_ADDRESS"];

export function validateConfig(env) {
  const errors = [];
  const reject = (key, reason) => errors.push(`${key}: ${reason}`);
  const requireValue = (key) => {
    if (!env[key] || placeholder.test(env[key])) reject(key, "missing or placeholder value");
  };
  if (!["preview", "public-preview", "public"].includes(env.DEPLOYMENT_MODE)) reject("DEPLOYMENT_MODE", "must be preview, public-preview or public");
  if (env.NODE_ENV !== "production") reject("NODE_ENV", "must be production");
  for (const key of ["NEXT_PUBLIC_USE_MOCK", "LOCAL_AUTO_VERIFY_EMAIL", "SEED_DEMO", "SEED_RESET"]) {
    if (env[key] && !["false", "0"].includes(env[key])) reject(key, "must be disabled");
  }
  for (const key of ["WEB_IMAGE", "API_IMAGE", "OPS_IMAGE"]) {
    if (!digest.test(env[key] ?? "")) reject(key, "must reference a GHCR image by sha256 digest");
  }
  for (const key of ["POSTGRES_USER", "POSTGRES_DB"]) {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(env[key] ?? "")) reject(key, "must be a lowercase PostgreSQL identifier");
  }
  requireValue("POSTGRES_PASSWORD");
  if (!/^[A-Za-z0-9_-]{32,}$/.test(env.POSTGRES_PASSWORD ?? "")) reject("POSTGRES_PASSWORD", "must contain at least 32 URL-safe characters");
  requireValue("EMAIL_VERIFICATION_SECRET");
  if (Buffer.byteLength(env.EMAIL_VERIFICATION_SECRET ?? "") < 32) reject("EMAIL_VERIFICATION_SECRET", "must contain at least 32 bytes");
  requireValue("MARKETPLACE_PROVIDER_TOKEN_KEY");
  if (!/^[A-Za-z0-9+/]{43}=$/.test(env.MARKETPLACE_PROVIDER_TOKEN_KEY ?? "") || Buffer.from(env.MARKETPLACE_PROVIDER_TOKEN_KEY ?? "", "base64").length !== 32) {
    reject("MARKETPLACE_PROVIDER_TOKEN_KEY", "must be a canonical base64 32-byte key");
  }
  let origin;
  try {
    const url = new URL(env.WEB_PUBLIC_URL);
    origin = url.origin;
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
    if (env.DEPLOYMENT_MODE === "preview" && origin !== "https://termspace.localhost:8443") throw new Error();
    if (env.DEPLOYMENT_MODE !== "preview" && (/localhost$|^127\.|^\[::1\]$/.test(url.hostname) || placeholder.test(url.hostname))) throw new Error();
  } catch { reject("WEB_PUBLIC_URL", "must be the HTTPS origin for the selected deployment mode"); }
  if (!origin || env.CORS_ORIGINS !== origin) reject("CORS_ORIGINS", "must match the web origin exactly");
  if (env.NEXT_PUBLIC_SITE_URL !== origin) reject("NEXT_PUBLIC_SITE_URL", "must match the web origin");
  if (env.MEDIA_PUBLIC_URL !== `${origin}/backend/media`) reject("MEDIA_PUBLIC_URL", "must use the same-origin /backend/media path");
  if (env.TRUST_PROXY !== "1") reject("TRUST_PROXY", "must be 1 for Nginx → Next → API");
  if (env.NEXT_PUBLIC_API_URL !== "/backend") reject("NEXT_PUBLIC_API_URL", "must be /backend");
  const mailConfigured = mailKeys.some((key) => Boolean(env[key]));
  if (mailConfigured || env.DEPLOYMENT_MODE === "public") for (const key of mailKeys) requireValue(key);
  if (env.EMAIL_FROM_ADDRESS && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.EMAIL_FROM_ADDRESS)) reject("EMAIL_FROM_ADDRESS", "must be an email address");
  if (env.DEPLOYMENT_MODE === "public") {
    requireValue("LEGAL_CONTACT_EMAIL");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.LEGAL_CONTACT_EMAIL ?? "")) reject("LEGAL_CONTACT_EMAIL", "must be an email address");
  }
  return errors;
}

export async function readConfig(file) {
  const metadata = await lstat(file);
  if (!metadata.isFile() || (metadata.mode & 0o077)) throw new Error("Configuration must be a regular file readable only by its owner (mode 600)");
  return parseEnv(await readFile(file, "utf8"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error("Usage: node deploy/check-config.mjs /path/to/preview.env");
    const errors = validateConfig(await readConfig(process.argv[2]));
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else console.log("Deployment configuration valid; values redacted. Email-dependent acceptance remains pending until delivery is verified.");
  } catch (error) {
    console.error(error.code ? `Cannot read configuration (${error.code})` : error.message);
    process.exitCode = 1;
  }
}
