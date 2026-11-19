import { expect, test } from "@playwright/test";

for (const locale of ["en", "fa"]) for (const theme of ["light", "dark"]) for (const persona of ["creator", "empty"]) {
  test(`overview keeps metrics aligned and close to working panels (${locale}/${theme}/${persona})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: persona, url: baseURL! }]);
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard`);
    await expect(page.locator("main [aria-busy=false]")).toBeVisible();
    const metrics = page.locator("main dl"); await expect(metrics.locator("dt")).toHaveCount(4);
    const geometry = await metrics.evaluate(element => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const contentBottom = Math.max(...Array.from(element.querySelectorAll("dd > span")).filter(node => node.textContent?.trim()).map(node => {
        const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect().bottom;
      }));
      return {
        panelGap: (element.nextElementSibling!.getBoundingClientRect().top - contentBottom) / rem,
        rows: Array.from(element.children).map(tile => ({ top: tile.getBoundingClientRect().top, valueTop: tile.querySelector("dd")!.getBoundingClientRect().top })),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.panelGap).toBeGreaterThanOrEqual(1.25);
    expect(geometry.panelGap).toBeLessThanOrEqual(2);
    for (const row of geometry.rows) for (const sibling of geometry.rows.filter(item => Math.abs(item.top - row.top) < 1)) {
      expect(Math.abs(row.valueTop - sibling.valueTop)).toBeLessThan(1);
    }
    expect(geometry.overflow).toBe(false);
  });
}
