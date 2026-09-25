import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build that reads the homepage
 * catalogue from the local fixture (NEXT_PUBLIC_USE_MOCK=1) and sends every
 * API call to e2e/mock-api.mjs, so they never need apps/api or a database.
 *
 * NEXT_PUBLIC_USE_MOCK is inlined at build time, so the web server step
 * builds first. CI builds once, shares the output with Lighthouse, and sets
 * E2E_SKIP_BUILD=1.
 */
const WEB_PORT = 3100;
const MOCK_API_PORT = 4099;
const baseURL = `http://127.0.0.1:${WEB_PORT}`;
const isCI = Boolean(process.env.CI);
const start = `npm run start -- -p ${WEB_PORT}`;
// Where the Playwright browser download is unavailable, PW_CHANNEL=chrome
// runs the suite in the locally installed Chrome instead.
const channel = process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, ...channel },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], ...channel },
    },
  ],
  webServer: [
    {
      command: "node --no-warnings e2e/mock-api.mjs",
      url: `http://127.0.0.1:${MOCK_API_PORT}/health`,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
      reuseExistingServer: !isCI,
    },
    {
      command: process.env.E2E_SKIP_BUILD === "1" ? start : `npm run build && ${start}`,
      url: baseURL,
      env: { NEXT_PUBLIC_USE_MOCK: "1", API_URL: `http://127.0.0.1:${MOCK_API_PORT}` },
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: "pipe",
    },
  ],
});
