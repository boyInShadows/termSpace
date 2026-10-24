import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { acceptsBrotli, compressedAssetFile } from "@/lib/static-assets";

const NOT_FOUND = { status: 404, headers: { "Cache-Control": "no-store", Vary: "Accept-Encoding" } };

export async function GET(request: Request, { params }: { params: Promise<{ asset: string[] }> }) {
  if (process.env.NODE_ENV !== "production" || request.headers.has("range") ||
    !acceptsBrotli(request.headers.get("accept-encoding"))) return new Response(null, NOT_FOUND);
  const { asset } = await params;
  const file = compressedAssetFile(asset);
  if (!file) return new Response(null, NOT_FOUND);
  try {
    // Proxy responses strip Content-Encoding; the route must own the encoded body.
    const body = await readFile(file);
    const etag = `"${createHash("sha256").update(body).digest("base64url")}"`;
    const headers = {
      "Content-Encoding": "br",
      "Content-Type": file.endsWith(".css.br") ? "text/css; charset=UTF-8" : "application/javascript; charset=UTF-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      Vary: "Accept-Encoding",
      ETag: etag,
    };
    const unchanged = request.headers.get("if-none-match")?.split(",")
      .some((tag) => tag.trim() === "*" || tag.trim().replace(/^W\//, "") === etag);
    if (unchanged) return new Response(null, { status: 304, headers });
    return new Response(new Uint8Array(body), { headers });
  } catch (cause) {
    const { code } = cause as NodeJS.ErrnoException;
    if (code === "ENOENT" || code === "ENOTDIR") return new Response(null, NOT_FOUND);
    throw cause;
  }
}
