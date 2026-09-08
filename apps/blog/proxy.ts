import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "term_academy_session";
const adminSessionTimeoutMs = 3_000;

async function adminSessionState(request: NextRequest): Promise<"valid" | "stale" | "unavailable"> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return "stale";

  try {
    const baseUrl = process.env.API_URL ?? "http://localhost:4001";
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/admin/session`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(adminSessionTimeoutMs),
    });
    if (response.status === 401) return "stale";
    return response.ok ? "valid" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const effectivePath = isPersian ? pathname.slice(3) || "/" : pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-term-locale", isPersian ? "fa" : "en");

  if (!effectivePath.startsWith("/admin") || effectivePath === "/admin/login") {
    if (!isPersian) return NextResponse.next({ request: { headers: requestHeaders } });
    const rewriteUrl = request.nextUrl.clone(); rewriteUrl.pathname = effectivePath;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  const sessionState = await adminSessionState(request);
  if (sessionState === "valid" || sessionState === "unavailable") {
    if (!isPersian) return NextResponse.next({ request: { headers: requestHeaders } });
    const rewriteUrl = request.nextUrl.clone(); rewriteUrl.pathname = effectivePath;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
