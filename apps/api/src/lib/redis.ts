import { Redis } from "ioredis";

/**
 * Shared counters for the rate limiters, so limits hold across API replicas and
 * restarts. Unset REDIS_URL (local dev, tests) keeps the counters in memory.
 */
function connect(url: string): Redis {
  // Short timeouts: with Redis down a request should pass uncounted, not hang.
  const client = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 2_000, commandTimeout: 1_000 });
  let down = false;
  client.on("error", (error) => {
    if (!down) console.error(`Redis unavailable; rate limits are not enforced until it returns: ${error.message}`);
    down = true;
  });
  client.on("ready", () => {
    if (down) console.error("Redis reconnected; rate limits enforced again");
    down = false;
  });
  return client;
}

export const redis = process.env.REDIS_URL ? connect(process.env.REDIS_URL) : undefined;
