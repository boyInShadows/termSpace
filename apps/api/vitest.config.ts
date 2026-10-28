import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    restoreMocks: true,
    // The integration suites share one database and the mail worker drains one global outbox,
    // so a file that sends mail must not run beside another that counts what was sent.
    fileParallelism: false,
    exclude: ["dist/**", "node_modules/**"],
  },
});
