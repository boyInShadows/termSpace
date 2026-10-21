import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test("a failed batch exits with its failure status instead of continuing the worker loop", async () => {
  const directory = await mkdtemp(join(tmpdir(), "termspace-worker-"));
  try {
    await mkdir(join(directory, "dist/jobs"), { recursive: true });
    await writeFile(join(directory, "dist/jobs/processMarketplaceSourceChecks.js"), "process.exit(7);\n");
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./worker.mjs", import.meta.url)), "source"], { cwd: directory, encoding: "utf8", timeout: 5000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 7);
    assert.match(result.stdout, /"exitCode":7/);
  } finally { await rm(directory, { recursive: true }); }
});
