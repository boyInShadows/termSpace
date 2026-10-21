import { spawn } from "node:child_process";
import { writeFile, stat } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const heartbeat = "/tmp/termspace-worker-heartbeat";
if (process.argv[2] === "--health") {
  const recent = await stat(heartbeat).then((value) => Date.now() - value.mtimeMs < 180_000).catch(() => false);
  process.exit(recent ? 0 : 1);
}

const jobs = {
  source: "dist/jobs/processMarketplaceSourceChecks.js",
  email: "dist/jobs/sendTransactionalEmails.js",
};
const job = jobs[process.argv[2]];
if (!job) throw new Error("Worker must be source or email");
let stopping = false;
let child;
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  stopping = true;
  controller.abort();
  child?.kill(signal);
});

while (!stopping) {
  const startedAt = Date.now();
  child = spawn(process.execPath, [job], { stdio: "inherit", env: process.env });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  child = undefined;
  if (stopping) break;
  console.info(JSON.stringify({ event: "worker_batch_completed", worker: process.argv[2], exitCode: code, latencyMs: Date.now() - startedAt }));
  if (code !== 0) process.exit(code);
  await writeFile(heartbeat, String(Date.now()), { mode: 0o600 });
  await setTimeout(30_000, undefined, { signal: controller.signal }).catch((error) => {
    if (error.name !== "AbortError") throw error;
  });
}
