import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const effectivePath = isPersian ? pathname.slice(3) || "/" : pathname;
  const headers = new Headers(request.headers);
  headers.set("x-term-locale", isPersian ? "fa" : "en");
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://accounts.google.com",
    "frame-src https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const url = request.nextUrl.clone();
  url.pathname = effectivePath;
  const response = isPersian
    ? NextResponse.rewrite(url, { request: { headers } })
    : NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = { matcher: ["/((?!api(?:/|$)|backend(?:/|$)|_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|fonts/).*)"] };
