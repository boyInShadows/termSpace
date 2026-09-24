import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

/**
 * First-load JavaScript budget, gzipped: every script the server-rendered
 * HTML references, read from the build output. Chunks loaded later with
 * dynamic import (the WebGL field) are not in the HTML and so not counted —
 * which is the point: anything heavy must be lazy to fit.
 *
 * Next 16's webpack build no longer writes app-build-manifest.json, so the
 * HTML is the reliable source of what a route ships up front.
 */
// Ratchet, like lighthouserc.cjs: gated at the 2026-09-24 baseline
// (/ 185 kB, /dashboard 182 kB) plus headroom. The plan's targets are 170 and
// 200; move a gate down when a phase meets it, never back up.
const BUDGETS_KB: Record<string, number> = {
  "/": 190,
  "/dashboard": 200,
};

const STATIC_DIR = path.join(__dirname, "..", ".next", "static");

test.describe("first-load JS budget", () => {
  for (const [route, budgetKb] of Object.entries(BUDGETS_KB)) {
    test(`${route} ships at most ${budgetKb} kB of gzipped JS`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "Measured once, from the build.");
      const html = await (await request.get(route)).text();
      // nomodule scripts (the legacy polyfills) are never fetched by a modern browser.
      const tags = [...html.matchAll(/<script[^>]*>/g)].map((match) => match[0]).filter((tag) => !/\snomodule\b/i.test(tag));
      const scripts = [...new Set(tags.flatMap((tag) => /src="\/_next\/static\/([^"?]+)"/.exec(tag)?.[1] ?? []))];
      expect(scripts.length, "scripts found in the HTML").toBeGreaterThan(0);

      let bytes = 0;
      for (const script of scripts) {
        bytes += gzipSync(await readFile(path.join(STATIC_DIR, decodeURIComponent(script)))).length;
      }
      const kb = Math.round((bytes / 1024) * 10) / 10;
      test.info().annotations.push({ type: "first-load JS", description: `${route}: ${kb} kB gz across ${scripts.length} scripts` });
      expect(kb, `${route} first-load JS (kB gz)`).toBeLessThanOrEqual(budgetKb);
    });
  }
});
