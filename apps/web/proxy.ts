import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const effectivePath = isPersian ? pathname.slice(3) || "/" : pathname;
  const headers = new Headers(request.headers);
  headers.set("x-term-locale", isPersian ? "fa" : "en");
  headers.set("x-term-path", effectivePath);
  if (!isPersian) return NextResponse.next({ request: { headers } });
  const url = request.nextUrl.clone();
  url.pathname = effectivePath;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = { matcher: ["/((?!api|backend|_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
