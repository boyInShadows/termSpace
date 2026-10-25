import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("Compose preserves complete tmpfs options and keeps service ports private", async () => {
  const directory = await mkdtemp(join(tmpdir(), "termspace-compose-test-"));
  const config = join(directory, "preview.env");
  try {
    execFileSync(process.execPath, ["deploy/init-preview.mjs", config]);
    let text = await readFile(config, "utf8");
    for (const kind of ["web", "api", "ops"]) {
      text = text.replace(new RegExp(`^${kind.toUpperCase()}_IMAGE=.*$`, "m"), `${kind.toUpperCase()}_IMAGE=ghcr.io/boyinshadows/termspace-${kind}@sha256:${"0".repeat(64)}`);
    }
    await writeFile(config, text, { mode: 0o600 });
    const { services } = JSON.parse(execFileSync("docker", ["compose", "--profile", "email", "--env-file", config, "-f", "deploy/compose.yml", "config", "--format", "json"], { encoding: "utf8" }));
    for (const name of ["api", "source-worker", "email-worker"]) {
      assert.equal(services[name].tmpfs.length, 1, `${name}: mount options must stay in one YAML string`);
      assert.match(services[name].tmpfs[0], /^\/tmp:size=\d+m,mode=1777$/);
    }
    assert.equal(services.web.ports[0].host_ip, "127.0.0.1");
    for (const name of ["api", "db", "redis", "source-worker", "email-worker"]) assert.equal(services[name].ports, undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
