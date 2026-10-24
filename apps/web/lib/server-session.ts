import { headers } from "next/headers";
import { getSession } from "./api";
import { cache } from "react";
import { getDashboardHome } from "./dashboard";

/** Bootstrap cold dashboard loads; public pages keep their existing client lookup. */
export const getServerSession = cache(async () => {
  const requestHeaders = await headers();
  const path = requestHeaders.get("x-term-path") ?? "";
  const cookie = requestHeaders.get("cookie");
  if (!(path === "/dashboard" || path.startsWith("/dashboard/")) || !cookie) return undefined;
  try {
    // A slow identity service must not hold the page behind its full retry timeout.
    return (await getSession({ headers: { cookie }, cache: "no-store", signal: AbortSignal.timeout(1500) })).data;
  } catch {
    return undefined;
  }
});

export async function getServerDashboardHome() {
  const session = await getServerSession();
  if (!session?.authenticated || !session.user.emailVerified) return undefined;
  const cookie = (await headers()).get("cookie");
  if (!cookie) return undefined;
  try {
    const home = await getDashboardHome(AbortSignal.timeout(1500), { cookie });
    return { email: session.user.email, home };
  } catch {
    return undefined;
  }
}
