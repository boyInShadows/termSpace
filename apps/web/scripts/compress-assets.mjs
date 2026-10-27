import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import assert from "node:assert/strict";

const assets = [];
async function compress(directory) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, file.name);
    if (file.isDirectory()) await compress(path);
    else if (file.isFile() && /\.(js|css)$/.test(file.name)) {
      const source = await readFile(path);
      const compressed = brotliCompressSync(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
      assert.deepEqual(brotliDecompressSync(compressed), source);
      await writeFile(`${path}.br`, compressed);
      assets.push(relative(".next/static", path).split(sep).join("/"));
    }
  }
}

await compress(".next/static");
assert(assets.length > 0, "No static assets found to compress");
await writeFile(".next/compressed-assets.json", JSON.stringify(assets));
console.log(`Precompressed ${assets.length} static JavaScript/CSS assets.`);
