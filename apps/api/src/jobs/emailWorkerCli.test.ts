import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("runs the email worker CLI and reports invalid configuration on every platform", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(new URL("./sendTransactionalEmails.ts", import.meta.url))], {
    env: { ...process.env, EMAIL_VERIFICATION_SECRET: "short" },
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("EMAIL_VERIFICATION_SECRET must contain at least 32 bytes");
});
