import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "staff", url: baseURL! }]);
});

for (const locale of ["en", "fa"]) for (const theme of ["light", "dark"]) {
  test(`header settles after crossing its scroll threshold (${locale}/${theme})`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    const prefix = locale === "fa" ? "/fa" : "";
    for (const route of ["", "/studio", "/moderation", "/library", "/tickets"]) {
      await page.goto(`${prefix}/dashboard${route}`);
      await expect(page.locator("main h1").first()).toBeVisible();
      const result = await page.evaluate(async () => {
        const header = document.querySelector<HTMLElement>("[data-site-header]")!;
        // Short content cannot cross the threshold; add test-only scroll space.
        const spacer = document.createElement("div"); spacer.style.height = "100vh"; document.querySelector("main")!.append(spacer);
        const samples: { height: number; condensed: boolean; sidebar: number | null }[] = [];
        window.scrollTo({ top: 81, behavior: "instant" });
        const start = performance.now();
        await new Promise<void>(resolve => {
          const frame = () => {
            const sidebar = document.querySelector<HTMLElement>("aside>div");
            samples.push({ height: header.getBoundingClientRect().height, condensed: Boolean(header.querySelector("[data-announcement].h-0")), sidebar: sidebar?.getBoundingClientRect().top ?? null });
            if (performance.now() - start < 1100) requestAnimationFrame(frame); else resolve();
          }; requestAnimationFrame(frame);
        });
        window.scrollTo({ top: 0, behavior: "instant" });
        return { reversals: samples.filter((sample, i) => i > 0 && sample.condensed !== samples[i - 1].condensed).length, tail: samples.slice(-10) };
      });
      expect(result.reversals).toBeLessThanOrEqual(1);
      expect(Math.max(...result.tail.map(x => x.height)) - Math.min(...result.tail.map(x => x.height))).toBeLessThan(0.1);
      await expect(page.locator("[data-announcement]")).toHaveClass(/h-9/);
      await page.reload();
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  });
}

for (const width of [768, 1920]) {
  test(`initial header and sidebar geometry survives delayed hydration (${width})`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "Explicit tablet/desktop widths");
    await page.setViewportSize({ width, height: 800 });
    let release!: () => void;
    const hydrated = new Promise<void>(resolve => { release = resolve; });
    await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async route => { await hydrated; await route.continue(); });
    try {
      await page.goto("/dashboard", { waitUntil: "commit" });
      const header = page.locator("[data-site-header]");
      await expect(header).toBeVisible();
      const initial = await header.boundingBox();
      const initialOffset = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--site-header-height"));
      expect(initialOffset.trim()).toBe("6.3125rem");
      release();
      await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--site-header-height"))).not.toBe("");
      expect((await header.boundingBox())!.height).toBe(initial!.height);
      // Use existing Next links to exercise persistent-header client navigation.
      for (const route of ["/studio", "/moderation", "/library", "/tickets", ""]) {
        await page.locator(`aside nav a[href="/dashboard${route}"]`).evaluate((element: HTMLAnchorElement) => element.click());
        await expect(page).toHaveURL(new RegExp(`/dashboard${route}$`));
        await expect(page.locator("main h1").first()).toBeVisible();
        expect((await header.boundingBox())!.height).toBe(initial!.height);
      }
      await page.screenshot({ path: info.outputPath(`stable-${width}.png`) });
    } finally { release(); }
  });
}
