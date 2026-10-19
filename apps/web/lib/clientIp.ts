import { headers } from "next/headers";

/**
 * Headers for API calls a server component makes on a visitor's behalf. The API
 * rate-limits search per client address and does not count calls without
 * X-Forwarded-For, so a search page must pass the visitor's through.
 */
export async function visitorHeaders(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
}
