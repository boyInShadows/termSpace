import "dotenv/config";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const workspace = fileURLToPath(new URL("../../", import.meta.url));
const url = new URL(
  process.env.MARKETPLACE_TEST_ADMIN_URL ?? process.env.DATABASE_URL ?? "",
);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  throw new Error(
    "Use a local PostgreSQL administrator connection for disposable database tests",
  );
const name = `termspace_batch_${Date.now()}_${randomBytes(4).toString("hex")}`;
const admin = new PrismaClient({
  datasources: { db: { url: url.toString() } },
  errorFormat: "minimal",
});
let created = false;
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  created = true;
  url.pathname = `/${name}`;
  const env = {
    ...process.env,
    DATABASE_URL: url.toString(),
    MARKETPLACE_TEST_DATABASE_URL: url.toString(),
    LOCAL_AUTO_VERIFY_EMAIL: "false",
    CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
    NODE_ENV: "test",
  };
  execFileSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "deploy",
      "--schema",
      "prisma/schema.prisma",
    ],
    { cwd: workspace, env, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      resolve(dirname(require.resolve("vitest/package.json")), "vitest.mjs"),
      "run",
      "src/marketplaceDiscovery.integration.test.ts",
    ],
    { cwd: workspace, env, stdio: "inherit" },
  );
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  if (created)
    await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.$disconnect();
}
