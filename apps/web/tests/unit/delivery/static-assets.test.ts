import { expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { acceptsBrotli, compressedAssetFile } from "@/lib/static-assets";

vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  const readFileSync = vi.fn().mockReturnValue(JSON.stringify(["chunks/app/[id]/page-123.js", "css/site-123.css"]));
  return { ...actual, readFileSync, default: { ...actual, readFileSync } };
});

it.each(["gzip, deflate, br, zstd", "BR; q=0.5", "br; q=1"])("accepts explicit Brotli support: %s", (value) => {
  expect(acceptsBrotli(value)).toBe(true);
});

it.each([null, "gzip", "br;q=0", "br;q=0, *;q=1", "br;q=bad", "br;q=2"])("keeps normal delivery for %s", (value) => {
  expect(acceptsBrotli(value)).toBe(false);
});

it("resolves only public static JavaScript and CSS variants", () => {
  expect(compressedAssetFile(["chunks", "app", "[id]", "page-123.js"])).toBe(resolve(".next/static/chunks/app/[id]/page-123.js.br"));
  expect(compressedAssetFile(["css", "site-123.css"])).toBe(resolve(".next/static/css/site-123.css.br"));
  for (const parts of [[], ["..", "secret.js"], [".. ", "secret.js"], ["../secret.js"], ["..\\secret.js"], ["C:\\secret.js"], ["bad\0.js"], ["chunks", "", "app.js"], ["unlisted.js"], ["app.js.map"], ["private.json"]]) {
    expect(compressedAssetFile(parts)).toBeNull();
  }
});

it("falls back when a build has no compression manifest", async () => {
  vi.resetModules();
  vi.mocked(readFileSync).mockImplementationOnce(() => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); });
  const fresh = await import("@/lib/static-assets");
  expect(fresh.compressedAssetFile(["css", "site-123.css"])).toBeNull();
});
