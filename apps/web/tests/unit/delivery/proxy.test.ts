import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { existsSync } from "node:fs";
import { proxy } from "@/proxy";

vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  const existsSync = vi.fn();
  const readFileSync = vi.fn().mockReturnValue(JSON.stringify(["chunks/app.js", "app.css"]));
  return { ...actual, existsSync, readFileSync, default: { ...actual, existsSync, readFileSync } };
});
beforeEach(() => { vi.stubEnv("NODE_ENV", "production"); vi.mocked(existsSync).mockReturnValue(true); });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("rewrites an available variant to the encoded-body route without changing the query", () => {
  const response = proxy(new NextRequest("https://termspace.test/_next/static/chunks/app.js?v=1", { headers: { "Accept-Encoding": "gzip, br" } }));
  expect(existsSync).toHaveBeenCalled();
  expect(response.headers.get("x-middleware-rewrite")).toBe("https://termspace.test/compressed-assets/chunks/app.js?v=1");
  expect(response.headers.has("Content-Encoding")).toBe(false);
  expect(response.headers.has("x-middleware-request-x-term-locale")).toBe(false);
});

it("keeps development, refused Brotli, missing assets and ranges on normal delivery", () => {
  const request = (headers = {}) => new NextRequest("https://termspace.test/_next/static/app.css", { headers: { "Accept-Encoding": "br", ...headers } });
  vi.stubEnv("NODE_ENV", "development");
  expect(proxy(request()).headers.has("x-middleware-rewrite")).toBe(false);
  vi.stubEnv("NODE_ENV", "production");
  expect(proxy(request({ "Accept-Encoding": "br;q=0" })).headers.has("x-middleware-rewrite")).toBe(false);
  expect(proxy(request({ Range: "bytes=0-99" })).headers.has("x-middleware-rewrite")).toBe(false);
  vi.mocked(existsSync).mockReturnValue(false);
  expect(proxy(request()).headers.has("x-middleware-rewrite")).toBe(false);
});

it.each(["..%2f..%2fsecret.js", "%ZZ.js"])("leaves unsafe or malformed paths to Next: %s", (path) => {
  expect(proxy(new NextRequest(`https://termspace.test/_next/static/${path}`, { headers: { "Accept-Encoding": "br" } })).headers.has("x-middleware-rewrite")).toBe(false);
  expect(existsSync).not.toHaveBeenCalled();
});

it("preserves Persian routing and its request-scoped dashboard headers", () => {
  const response = proxy(new NextRequest("https://termspace.test/fa/dashboard?tab=saved", { headers: { "Accept-Encoding": "br" } }));
  expect(response.headers.get("x-middleware-rewrite")).toBe("https://termspace.test/dashboard?tab=saved");
  expect(response.headers.get("x-middleware-request-x-term-locale")).toBe("fa");
  expect(response.headers.get("x-middleware-request-x-term-path")).toBe("/dashboard");
});
