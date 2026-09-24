import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  // e2e/ holds Playwright specs; they run under `npm run e2e`, not Vitest.
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], exclude: [...configDefaults.exclude, "e2e/**"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
