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
  if (!isPersian) return NextResponse.next({ request: { headers } });
  const url = request.nextUrl.clone();
  url.pathname = effectivePath;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = { matcher: ["/((?!api|backend|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/_next/static/:path*"] };
