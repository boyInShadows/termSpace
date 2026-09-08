import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const backendTimeoutMs = 15_000;

function upstreamUrl(request: NextRequest): string {
  const baseUrl = process.env.API_URL ?? "http://localhost:4001";
  const path = request.nextUrl.pathname.slice("/backend".length) || "/";
  return `${baseUrl.replace(/\/$/, "")}${path}${request.nextUrl.search}`;
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(upstreamUrl(request), {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(backendTimeoutMs),
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-length");

    // The API must never set a parent-domain cookie. Since this response is
    // served by the frontend origin, omitting Domain keeps the session cookie
    // host-only while allowing the frontend proxy to forward it to the API.
    const setCookies = upstream.headers.getSetCookie();
    responseHeaders.delete("set-cookie");
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie.replace(/;\s*Domain=[^;]*/gi, ""));
    }

    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return NextResponse.json(
      { error: { code: timedOut ? "BACKEND_TIMEOUT" : "BACKEND_UNAVAILABLE", message: timedOut ? "The backend request timed out" : "The backend is unavailable" } },
      { status: timedOut ? 504 : 502 },
    );
  }
}
