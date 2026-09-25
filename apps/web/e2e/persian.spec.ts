import { expect, test, type Page } from "@playwright/test";

const PERSIAN_DIGITS = /[۰-۹]/;

/** Elements outside Latin data islands whose Persian text is tracked or capitalised. */
function styledPersianText(page: Page) {
  return page.evaluate(() => {
    const offenders: string[] = [];
    for (const node of document.body.querySelectorAll("*")) {
      if (node.closest("[dir=ltr]")) continue;
      const ownText = [...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent ?? "").join("").trim();
      if (!/[؀-ۿ]/.test(ownText)) continue;
      const style = getComputedStyle(node);
      const tracked = style.letterSpacing !== "normal" && parseFloat(style.letterSpacing) !== 0;
      if (tracked || style.textTransform === "uppercase") offenders.push(`${node.tagName.toLowerCase()}: ${ownText.slice(0, 30)}`);
    }
    return offenders;
  });
}

test.describe("persian", () => {
  test("/fa is right-to-left and set in Estedad", async ({ page }) => {
    await page.goto("/fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont.toLowerCase()).toContain("estedad");
  });

  for (const path of ["/fa", "/fa/explore", "/fa/products/conversion-copywriter"]) {
    test(`no Persian text is tracked or capitalised on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await styledPersianText(page)).toEqual([]);
    });
  }

  test("display type runs smaller, looser and lighter than the English", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const measure = () =>
      page.locator("h1").evaluate((node) => {
        const style = getComputedStyle(node);
        return { size: parseFloat(style.fontSize), leading: parseFloat(style.lineHeight) / parseFloat(style.fontSize), weight: style.fontWeight };
      });
    await page.goto("/");
    const english = await measure();
    await page.goto("/fa");
    const persian = await measure();

    expect(persian.size).toBeLessThan(english.size);
    expect(persian.leading).toBeCloseTo(1.35, 2);
    expect(persian.weight).toBe("600");
  });

  test("the ticker runs mirrored, towards the reading end", async ({ page }) => {
    await page.goto("/fa");
    const track = page.locator(".animate-marquee");
    await expect(track).toHaveCSS("animation-name", "ts-marquee-rtl");
    const x = () => track.evaluate((node) => node.getBoundingClientRect().left);
    const before = await x();
    await page.waitForTimeout(800);
    expect(await x()).toBeGreaterThan(before);
  });

  test("prose counts use Persian digits; the terminal card keeps Latin ones", async ({ page }) => {
    await page.goto("/fa");
    const featured = page.locator("article").first();
    await expect(featured).toContainText(PERSIAN_DIGITS);
    await expect(page.locator(".ts-seq")).toHaveAttribute("dir", "ltr");
    await expect(page.locator(".ts-seq")).not.toContainText(PERSIAN_DIGITS);
  });
});
