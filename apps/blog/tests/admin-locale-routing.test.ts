import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

afterEach(() => vi.unstubAllGlobals());

it("canonicalizes Persian admin context and still requires an authenticated destination", async () => {
  const fetcher = vi.fn().mockResolvedValue({ status: 401, ok: false });
  vi.stubGlobal("fetch", fetcher);
  const localized = await proxy(new NextRequest("http://localhost/fa/admin/articles/new?draft=1"));
  expect(localized.headers.get("location")).toBe("http://localhost/admin/articles/new?draft=1");
  expect(fetcher).not.toHaveBeenCalled();
  const protectedPage = await proxy(new NextRequest(localized.headers.get("location")!));
  expect(new URL(protectedPage.headers.get("location")!).pathname).toBe("/admin/login");
  const stale = await proxy(new NextRequest("http://localhost/admin", { headers: { cookie: "term_academy_session=stale" } }));
  expect(fetcher).toHaveBeenCalledOnce();
  expect(new URL(stale.headers.get("location")!).pathname).toBe("/admin/login");
});

it("preserves Persian public routing and fails closed when admin verification is unavailable", async () => {
  const publicPage = await proxy(new NextRequest("http://localhost/fa/blog?q=workflow"));
  expect(publicPage.headers.get("x-middleware-rewrite")).toBe("http://localhost/blog?q=workflow");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unavailable")));
  const unavailable = await proxy(new NextRequest("http://localhost/admin/media", { headers: { cookie: "term_academy_session=test" } }));
  expect(unavailable.status).toBe(503);
});
