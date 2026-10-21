import { verificationSecret } from "./emailVerification.js";
import { providerTokenKey } from "./marketplaceProviderToken.js";

/** Refuse to boot with a config that would otherwise fail on the first request that needs it. */
export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  // The compose file only checks that the database password is non-empty.
  if (/change-this|replace-with/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("DATABASE_URL still contains a .env.example placeholder");
  }
  // Without it each replica counts rate limits on its own, in memory.
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL must point at the shared rate-limit store");
  if (!process.env.CORS_ORIGINS) throw new Error("CORS_ORIGINS must list the public web and blog origins");
  if (process.env.LOCAL_AUTO_VERIFY_EMAIL === "true") throw new Error("LOCAL_AUTO_VERIFY_EMAIL must not be set in production");
  verificationSecret();
  providerTokenKey();
}
