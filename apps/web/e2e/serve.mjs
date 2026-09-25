// Serves the mock-fixture production build for Lighthouse CI: the mock API
// in-process, and `next start` pointed at it. Build first with
// NEXT_PUBLIC_USE_MOCK=1 (see the web workflow).
import { spawn } from "node:child_process";
import "./mock-api.mjs";

const WEB_PORT = process.env.WEB_PORT ?? "3100";
const MOCK_API_PORT = process.env.MOCK_API_PORT ?? "4099";

const web = spawn("npm", ["run", "start", "--", "-p", WEB_PORT], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, NEXT_PUBLIC_USE_MOCK: "1", API_URL: `http://127.0.0.1:${MOCK_API_PORT}` },
});

web.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => web.kill(signal));
