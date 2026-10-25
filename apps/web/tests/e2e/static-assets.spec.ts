import { get, type IncomingHttpHeaders } from "node:http";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

function raw(url: URL, headers: Record<string, string>, method = "GET") {
  return new Promise<{ status: number; headers: IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    const request = get(url, { headers, method }, (response) => {
      const parts: Buffer[] = [];
      response.on("data", (part: Buffer) => parts.push(part));
      response.on("error", reject);
      response.on("end", () => resolve({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(parts) }));
    });
    request.on("error", reject);
    request.setTimeout(10_000, () => request.destroy(new Error("Static asset request timed out")));
  });
}

test("static compression preserves bytes, negotiation, cache and range fallback", async ({ request, baseURL }) => {
  const html = await (await request.get("/")).text();
  const script = /<script[^>]+src="([^"?]+\.js)"/.exec(html)![1];
  const css = /<link[^>]+href="([^"?]+\.css)"/.exec(html)![1];

  for (const file of [script, css]) {
    const url = new URL(file, baseURL);
    const identity = await raw(url, { "Accept-Encoding": "identity" });
    const brotli = await raw(url, { "Accept-Encoding": "br" });
    expect(identity.status).toBe(200);
    expect(brotli.status).toBe(200);
    expect(brotli.headers["content-encoding"]).toBe("br");
    expect(brotliDecompressSync(brotli.body)).toEqual(identity.body);
    expect(brotli.headers["content-type"]).toBe(identity.headers["content-type"]);
    expect(brotli.headers.vary).toContain("Accept-Encoding");
    expect(brotli.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(brotli.headers["x-content-type-options"]).toBe("nosniff");
    expect(brotli.headers["set-cookie"]).toBeUndefined();
    expect(brotli.headers.etag).toBeTruthy();
    const revalidated = await raw(url, { "Accept-Encoding": "br", "If-None-Match": brotli.headers.etag! });
    expect(revalidated.status).toBe(304);
    expect(revalidated.body.length).toBe(0);
    expect(revalidated.headers.etag).toBe(brotli.headers.etag);

    const refused = await raw(url, { "Accept-Encoding": "gzip, br;q=0" });
    expect(refused.headers["content-encoding"]).toBe("gzip");
    expect(gunzipSync(refused.body)).toEqual(identity.body);
    const head = await raw(url, { "Accept-Encoding": "br" }, "HEAD");
    expect(head.status).toBe(200);
    expect(head.headers["content-encoding"]).toBe("br");
    expect(head.body.length).toBe(0);

    const range = await raw(url, { "Accept-Encoding": "br, identity", Range: "bytes=0-31" });
    expect(range.status).toBe(206);
    expect(range.headers["content-encoding"]).not.toBe("br");
    expect(range.body).toEqual(identity.body.subarray(0, 32));
  }

  const unsafe = await raw(new URL("/compressed-assets/..%2f..%2fprivate.js", baseURL), { "Accept-Encoding": "br" });
  expect(unsafe.status).toBe(404);
  expect(unsafe.headers["content-encoding"]).not.toBe("br");
});
