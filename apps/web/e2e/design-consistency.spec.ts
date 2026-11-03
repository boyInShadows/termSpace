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
        // A card is an article framed on all sides; review entries are divided
        // rules (border-bottom only) and are not cards.
        const cards = [...document.querySelectorAll("article")]
          .filter((card) => getComputedStyle(card).borderTopWidth !== "0px")
          .map((card) => ({ radius: getComputedStyle(card).borderRadius, shadow: getComputedStyle(card).boxShadow }));
        return {
          headingFont: style.fontFamily,
          headingWeight: style.fontWeight,
          fields: fields.map((field) => getComputedStyle(field).borderRadius),
          cards,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      headingFont ??= styles.headingFont;
      expect(styles.headingFont, route).toBe(headingFont);
      expect(styles.headingFont).not.toContain("Newsreader");
      expect(styles.headingWeight, route).toBe("600");
      expect(styles.overflow, route).toBe(false);
      const isLanding = route === "/";
      if (!isLanding) {
        // One soft shape system: 12px controls, 16px cards with a panel shadow.
        expect(styles.fields.every((radius) => radius === "12px"), route).toBe(true);
        expect(styles.cards.every((card) => card.radius === "16px" && card.shadow !== "none"), route).toBe(true);
      }
    }
  });
}

test("hero search keeps its prompt and keyboard focus exposes usable suggestions", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox");
  const placeholder = await search.getAttribute("placeholder");
  await page.waitForTimeout(900);
  expect(await search.getAttribute("placeholder")).toBe(placeholder);
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

for (const locale of ["en", "fa"] as const) {
  test(`phone filters keep a named, clickable switch inside its track (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(locale === "fa" ? "/fa/explore" : "/explore");
    await page.getByRole("button", { name: locale === "fa" ? "فیلترها" : "Filters", exact: true }).click();
    const drawer = page.getByRole("dialog");
    const label = locale === "fa" ? "فقط بررسی‌شده" : "Reviewed only";
    const toggle = drawer.getByRole("switch", { name: label });
    await drawer.locator("label").filter({ hasText: label }).click();
    await expect(toggle).toBeChecked();
    await expect(page).toHaveURL(/verified=true/);
    await expect.poll(() => toggle.evaluate((element) => {
      const track = element.getBoundingClientRect();
      const thumb = element.querySelector("span")!.getBoundingClientRect();
      return thumb.left >= track.left && thumb.right <= track.right;
    })).toBe(true);
    expect(await page.locator("[id]").evaluateAll((elements) => new Set(elements.map((element) => element.id)).size === elements.length)).toBe(true);
  });
}

test("discovery sorting stays reachable below the condensed global header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/explore");
  const sort = page.getByRole("combobox", { name: "Sort resources" });
  await expect(sort).toBeVisible();
  await page.mouse.wheel(0, 700);
  await expect.poll(() => sort.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const header = document.querySelector("[data-site-header]")!.getBoundingClientRect();
    return box.top >= header.bottom - 1 && element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
});

test("a saved light theme hydrates with an accurate toggle destination", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  const hydrationErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error" && /hydration|hydrated/i.test(message.text())) hydrationErrors.push(message.text()); });
  await page.goto("/explore");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});
