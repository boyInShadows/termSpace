import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect, test, type Page, type TestInfo } from "@playwright/test";

async function zoomContext(info: TestInfo, zoom: number, width: number, height: number) {
  const profile = info.outputPath(`profile-${zoom}`);
  await mkdir(path.join(profile, "Default"), { recursive: true });
  // Chrome stores default zoom per storage partition; "x" is the default partition.
  await writeFile(path.join(profile, "Default", "Preferences"), JSON.stringify({
    partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } },
  }));
  // Clear the runner's emulated DPR so Chrome can apply native browser zoom.
  return chromium.launchPersistentContext(profile, {
    channel: process.env.PW_CHANNEL, headless: true, viewport: null, deviceScaleFactor: undefined,
    args: [`--window-size=${width},${height}`],
  });
}

async function focusedControlIsVisible(page: Page) {
  return page.evaluate(() => {
    const control = document.activeElement;
    if (!control || !document.querySelector("main")?.contains(control)) return false;
    return [...control.getClientRects()].some((rect) => {
      if (rect.width < 1 || rect.height < 1) return false;
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return x >= 0 && x < innerWidth && y >= 0 && y < innerHeight &&
        (hit === control || (hit !== null && control.contains(hit)));
    });
  });
}

for (const [width, height] of [[1280, 900], [1920, 1080], [2560, 1440]]) {
  for (const locale of ["en", "fa"]) for (const theme of ["light", "dark"]) {
    test(`dashboard keyboard targets remain reachable at real 200% zoom (${locale}/${theme}/${width})`, async ({ baseURL }, info) => {
      test.skip(info.project.name !== "desktop-chromium", "Desktop browser zoom; physical mobile acceptance is separate.");
      test.setTimeout(60_000);
      const baselineContext = await zoomContext(info, 1, width, height);
      let baseline: { width: number; dpr: number };
      try {
        const page = baselineContext.pages()[0];
        await page.goto(`${baseURL}/explore`, { waitUntil: "networkidle" });
        baseline = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }));
      } finally { await baselineContext.close(); }

      const context = await zoomContext(info, 2, width, height);
      try {
        await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
        await context.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
        const page = context.pages()[0];
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
        await page.route("**/api/marketplace/favorites", (route) => route.fulfill({
          json: { data: ["conversion-copywriter", "unavailable-saved"] },
        }));
        for (const route of ["/dashboard", "/dashboard/studio", "/dashboard/settings", "/dashboard/library", "/dashboard/library/saved"]) {
          await page.goto(`${baseURL}${locale === "fa" ? "/fa" : ""}${route}`, { waitUntil: "networkidle" });
          await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
          const geometry = await page.evaluate(() => ({
            width: innerWidth, dpr: devicePixelRatio, scale: visualViewport!.scale,
            cssZoom: getComputedStyle(document.documentElement).zoom,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          expect(geometry.dpr / baseline!.dpr).toBeCloseTo(2, 2);
          expect(Math.abs(geometry.width * 2 - baseline!.width)).toBeLessThanOrEqual(2);
          expect(geometry.scale).toBe(1);
          expect(geometry.cssZoom).toBe("1");
          expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

          await page.keyboard.press("Control+k");
          await expect(page.locator("#dashboard-search")).toBeFocused();
          await expect.poll(() => focusedControlIsVisible(page)).toBe(true);

          const first = route.endsWith("/settings") ? page.locator('main input[type="password"]').first()
            : route.endsWith("/saved") ? page.locator('main a[href*="/products/"]').first() : null;
          if (first) {
            await first.focus();
            for (let step = 0; step < 18; step++) {
              const inMain = await page.evaluate(() => document.querySelector("main")!.contains(document.activeElement));
              if (!inMain) break;
              await expect.poll(() => focusedControlIsVisible(page), { message: `Focused control is obscured on ${route}, step ${step}` }).toBe(true);
              await page.keyboard.press("Tab");
            }
          }
          expect(errors).toEqual([]);
        }
      } finally { await context.close(); }
    });
  }
}
