import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());

it("overrides supplied nonces and applies a fresh production policy on English and Persian HTML", () => {
  vi.stubEnv("NODE_ENV", "production");
  const nonces = new Set<string>();
  for (const path of ["/account", "/fa/account", "/unknown.file"]) {
    const response = proxy(new NextRequest(`https://termspace.localhost${path}`, { headers: { "x-nonce": "forged" } }));
    const nonce = response.headers.get("x-middleware-request-x-nonce")!;
    const policy = response.headers.get("Content-Security-Policy")!;
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(nonce).not.toBe("forged");
    expect(policy).toContain(`'nonce-${nonce}' 'strict-dynamic'`);
    expect(policy.split(";").find((directive) => directive.trim().startsWith("script-src "))).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    expect(response.headers.get("x-middleware-request-x-term-locale")).toBe(path.startsWith("/fa/") ? "fa" : "en");
    if (path.startsWith("/fa/")) expect(response.headers.get("x-middleware-rewrite")).toBe("https://termspace.localhost/account");
    nonces.add(nonce);
  }
  expect(nonces.size).toBe(3);
});
