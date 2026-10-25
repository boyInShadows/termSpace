import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { existsSync } from "node:fs";
import { acceptsBrotli, compressedAssetFile } from "@/lib/static-assets";

const STATIC_PREFIX = "/_next/static/";

function compressedAssetRewrite(request: NextRequest) {
  const isRead = request.method === "GET" || request.method === "HEAD";
  if (process.env.NODE_ENV !== "production" || !isRead || request.headers.has("range") ||
    !acceptsBrotli(request.headers.get("accept-encoding"))) return NextResponse.next();

  const assetPath = request.nextUrl.pathname.slice(STATIC_PREFIX.length);
  let parts: string[];
  try { parts = assetPath.split("/").map(decodeURIComponent); }
  catch { return NextResponse.next(); }
  const file = compressedAssetFile(parts);
  if (!file || !existsSync(file)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/compressed-assets/${assetPath}`;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(STATIC_PREFIX)) return compressedAssetRewrite(request);
  const isPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const effectivePath = isPersian ? pathname.slice(3) || "/" : pathname;
  const headers = new Headers(request.headers);
  headers.set("x-term-locale", isPersian ? "fa" : "en");
  headers.set("x-term-path", effectivePath);
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

export const config = { matcher: ["/((?!api(?:/|$)|backend(?:/|$)|_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|fonts/).*)", "/_next/static/:path*"] };
