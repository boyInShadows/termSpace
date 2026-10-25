import { expect, test } from "@playwright/test";

for (const locale of ["en", "fa"]) for (const theme of ["light", "dark"]) {
  test(`public pages and dashboard share the design foundations (${locale}/${theme})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
    await context.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
    const prefix = locale === "fa" ? "/fa" : "";
    let headingFont: string | undefined;
    for (const route of ["/", "/dashboard", "/explore", "/products/conversion-copywriter", "/account", "/communities"]) {
      await page.goto(`${prefix}${route === "/" ? "" : route}`);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
      const styles = await page.evaluate(() => {
        const style = getComputedStyle(document.querySelector("h1")!);
        const fields = [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea')];
        const cards = [...document.querySelectorAll("article")];
        return {
          headingFont: style.fontFamily,
          fields: fields.map((field) => getComputedStyle(field).borderRadius),
          cards: cards.map((card) => ({ radius: getComputedStyle(card).borderRadius, shadow: getComputedStyle(card).boxShadow })),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      headingFont ??= styles.headingFont;
      expect(styles.headingFont, route).toBe(headingFont);
      expect(styles.headingFont).not.toContain("Newsreader");
      expect(styles.overflow, route).toBe(false);
      const isLanding = route === "/";
      if (!isLanding) {
        expect(styles.fields.every((radius) => radius === "0px"), route).toBe(true);
        expect(styles.cards.every((card) => card.radius === "0px" && card.shadow === "none"), route).toBe(true);
      }
    }
  });
}

test("hero search types an intent and keyboard focus exposes usable suggestions", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox");
  const placeholder = await search.getAttribute("placeholder");
  await page.waitForTimeout(900);
  expect(await search.getAttribute("placeholder")).not.toBe(placeholder);
  await search.focus();
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("type", "submit");
  const focusVisible = await focused.evaluate((node) => getComputedStyle(node).outlineStyle !== "none");
  expect(focusVisible).toBe(true);
});
