// Lighthouse CI for apps/web: mobile emulation (Lighthouse's default, so no
// preset), median of three runs, against the production build serving the
// mock fixture (apps/web/e2e/serve.mjs). First-load JS is enforced by
// apps/web/e2e/budget.spec.ts, from the build output.
//
// Run from the repository root after a build made with NEXT_PUBLIC_USE_MOCK=1:
//   npm run lhci -w apps/web
//
// Ratchet. The gates fail at the 2026-09-24 baseline plus headroom, so
// nothing may get worse. `target` is the plan.md (Part B §5) budget; when a
// later phase meets it, move the gate down to it and never back up.
//
// Baseline, local mobile median:  /           /dashboard
//   LCP                            3.16 s      3.62 s
//   Performance                    92          89
//   TBT / CLS / max-potential-FID  42 ms / 0.026 / 80 ms   27 ms / 0.028 / 77 ms
//   Accessibility                  100         100
//
// Detail page (added in P4, /products/conversion-copywriter): LCP 3.24 s,
// performance 93, TBT 17 ms, CLS 0, accessibility 100.
const BASE = "http://127.0.0.1:3100";

const GATES = {
  home: {
    lcp: { gate: 3500, target: 2200 },
    performance: { gate: 0.88, target: 0.9 },
    imageBytes: { gate: 250 * 1024, target: 250 * 1024 },
  },
  dashboard: {
    lcp: { gate: 4000, target: 2000 },
    performance: { gate: 0.85, target: 0.92 },
    imageBytes: { gate: 150 * 1024, target: 150 * 1024 },
  },
  detail: {
    lcp: { gate: 3500, target: 2200 },
    performance: { gate: 0.9, target: 0.9 },
    imageBytes: { gate: 400 * 1024, target: 400 * 1024 },
  },
};

const median = { aggregationMethod: "median-run" };

function assertions({ lcp, performance, imageBytes }) {
  return {
    "largest-contentful-paint": ["error", { maxNumericValue: lcp.gate, ...median }],
    // Already inside the plan's budget: gated at the target.
    "total-blocking-time": ["error", { maxNumericValue: 150, ...median }],
    "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, ...median }],
    // Lab proxy for INP.
    "max-potential-fid": ["error", { maxNumericValue: 130, ...median }],
    "categories:performance": ["error", { minScore: performance.gate, ...median }],
    "categories:accessibility": ["error", { minScore: 1, ...median }],
    "resource-summary:image:size": ["error", { maxNumericValue: imageBytes.gate, ...median }],
  };
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: "node e2e/serve.mjs",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60000,
      url: [`${BASE}/`, `${BASE}/dashboard`, `${BASE}/products/conversion-copywriter`],
      numberOfRuns: 3,
      settings: {
        // The mock API reads this cookie as a signed-in creator, so
        // /dashboard is measured with its real content, not the sign-in
        // redirect.
        extraHeaders: JSON.stringify({ Cookie: "e2e_persona=creator" }),
      },
    },
    assert: {
      assertMatrix: [
        { matchingUrlPattern: "^http://[^/]+/$", assertions: assertions(GATES.home) },
        { matchingUrlPattern: "/dashboard$", assertions: assertions(GATES.dashboard) },
        { matchingUrlPattern: "/products/[^/]+$", assertions: assertions(GATES.detail) },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci/reports" },
  },
};
