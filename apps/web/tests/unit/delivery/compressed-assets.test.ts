import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import { GET } from "@/app/compressed-assets/[...asset]/route";

vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  const readFileSync = vi.fn().mockReturnValue(JSON.stringify(["chunks/app.js"]));
  return { ...actual, readFileSync, default: { ...actual, readFileSync } };
});
vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  const readFile = vi.fn();
  return { ...actual, readFile, default: { ...actual, readFile } };
});
beforeEach(() => vi.stubEnv("NODE_ENV", "production"));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const request = (encoding = "br", headers = {}) => new Request("https://termspace.test/compressed-assets/chunks/app.js", { headers: { "Accept-Encoding": encoding, ...headers } });
const params = (asset = ["chunks", "app.js"]) => ({ params: Promise.resolve({ asset }) });

it("returns the exact encoded public asset with cache and negotiation headers", async () => {
  const source = Buffer.from("window.fixture = true;");
  vi.mocked(readFile).mockResolvedValue(brotliCompressSync(source));
  const response = await GET(request(), params());
  expect(response.status).toBe(200);
  expect(brotliDecompressSync(Buffer.from(await response.arrayBuffer()))).toEqual(source);
  expect(response.headers.get("Content-Encoding")).toBe("br");
  expect(response.headers.get("Content-Type")).toBe("application/javascript; charset=UTF-8");
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
  expect(response.headers.get("Vary")).toBe("Accept-Encoding");
});

it("rejects unsafe paths and refused encodings before reading a file", async () => {
  expect((await GET(request(), params(["..", "private.js"]))).status).toBe(404);
  expect((await GET(request(), params(["unlisted.js"]))).status).toBe(404);
  const refused = await GET(request("br;q=0"), params());
  expect(refused.status).toBe(404);
  expect(refused.headers.get("Cache-Control")).toBe("no-store");
  expect(refused.headers.get("Vary")).toBe("Accept-Encoding");
  expect(readFile).not.toHaveBeenCalled();
});

it("revalidates the encoded representation without resending its body", async () => {
  vi.mocked(readFile).mockResolvedValue(brotliCompressSync(Buffer.from("window.fixture = true;")));
  const original = await GET(request(), params());
  const etag = original.headers.get("ETag")!;
  expect(etag).toBeTruthy();
  for (const validator of [etag, `W/${etag}`, `"old", ${etag}`, "*"]) {
    const response = await GET(request("br", { "If-None-Match": validator }), params());
    expect(response.status).toBe(304);
    expect((await response.arrayBuffer()).byteLength).toBe(0);
    expect(response.headers.get("ETag")).toBe(etag);
    expect(response.headers.get("Vary")).toBe("Accept-Encoding");
  }
  expect((await GET(request("br", { "If-None-Match": "\"old\"" }), params())).status).toBe(200);
});

it.each(["ENOENT", "ENOTDIR"])("returns 404 for %s and propagates filesystem failures", async (code) => {
  vi.mocked(readFile).mockRejectedValueOnce(Object.assign(new Error("missing"), { code }));
  expect((await GET(request(), params())).status).toBe(404);
  vi.mocked(readFile).mockRejectedValueOnce(Object.assign(new Error("denied"), { code: "EACCES" }));
  await expect(GET(request(), params())).rejects.toThrow("denied");
});
