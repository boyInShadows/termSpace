import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  // Playwright specs run under `npm run e2e`, not Vitest.
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**", "tests/e2e/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
