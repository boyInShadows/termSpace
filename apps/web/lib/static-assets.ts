import { resolve, sep } from "node:path";
import { readFileSync } from "node:fs";

let generatedAssets: Set<string> | undefined;

function isGeneratedAsset(path: string) {
  if (!generatedAssets) {
    try { generatedAssets = new Set(JSON.parse(readFileSync(resolve(".next/compressed-assets.json"), "utf8"))); }
    catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw cause;
    }
  }
  return generatedAssets.has(path);
}

export function acceptsBrotli(value: string | null) {
  const encodings = value?.toLowerCase().split(",") ?? [];
  const encoding = encodings.find((part) => part.split(";")[0].trim() === "br");
  if (!encoding) return false;
  const weight = encoding.split(";").slice(1)
    .map((part) => part.trim()).find((part) => part.startsWith("q="));
  const quality = weight ? Number(weight.slice(2)) : 1;
  return quality > 0 && quality <= 1;
}

export function compressedAssetFile(parts: string[]) {
  const filename = parts.at(-1);
  if (!filename || !/\.(js|css)$/.test(filename)) return null;
  if (parts.some((part) => !part || part === "." || part === ".." || /[\\/\0]/.test(part))) return null;
  const root = resolve(".next/static");
  const file = `${resolve(root, ...parts)}.br`;
  return file.startsWith(`${root}${sep}`) && isGeneratedAsset(parts.join("/")) ? file : null;
}
