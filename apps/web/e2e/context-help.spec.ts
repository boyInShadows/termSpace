import { expect, test, type Locator } from "@playwright/test";
import { copy } from "../lib/i18n";

async function inViewport(tooltip: Locator) {
  const bounds = await tooltip.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: innerWidth, height: innerHeight };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(7);
  expect(bounds.top).toBeGreaterThanOrEqual(7);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width - 7);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height - 7);
}

test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
  await page.route("**/api/marketplace/draft-options", (route) => route.fulfill({ json: { data: {
    categories: [{ slug: "development", name: "Development" }],
    platforms: [{ key: "codex", name: "Codex" }],
    communities: [{ slug: "codex", nameEn: "Codex", nameFa: "کدکس", descriptionEn: "Tools for Codex", descriptionFa: "ابزارهای کدکس" }],
  } } }));
});

for (const locale of ["en", "fa"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`help across all editor steps: ${locale} ${theme}`, async ({ page }, testInfo) => {
      const mobile = testInfo.project.name.startsWith("mobile");
      await page.setViewportSize({ width: mobile ? 320 : 1280, height: 800 });
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const prefix = locale === "fa" ? "/fa" : "";
      const helpName = locale === "fa" ? /^راهنما:/ : /^Help:/;
      await page.goto(`${prefix}/dashboard/studio/listings/new`);
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      const slug = page.locator('[name="slug"]');
      await expect(slug).toBeVisible();
      await slug.fill("preserve-help-input");
      const steps = page.locator('nav[aria-label] button[aria-current="step"]').locator("..").locator("..").getByRole("button");
      for (let step = 0; step < 5; step++) {
        if (step > 0) await steps.nth(step).click();
        const panel = page.locator(`[data-draft-step="${step}"]`);
        await expect(panel).toBeVisible();
        const helps = panel.getByRole("button", { name: helpName });
        expect(await helps.count()).toBeGreaterThan(0);
        let index = 0;
        for (const trigger of await helps.all()) {
          if (mobile) await trigger.tap();
          else { await trigger.focus(); }
          const tooltip = page.getByRole("tooltip");
          await expect(tooltip).toBeVisible();
          await expect(trigger).toHaveAttribute("aria-describedby", await tooltip.getAttribute("id") as string);
          await expect(tooltip.locator("bdi")).toBeVisible();
          await inViewport(tooltip);
          if (index++ === 0) await page.screenshot({ path: testInfo.outputPath(`step-${step}-${locale}-${theme}.png`) });
          expect(await trigger.evaluate((button) => {
            const box = button.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          })).toBe(true);
          if (mobile) await trigger.tap();
          else await page.keyboard.press("Escape");
          await expect(tooltip).toHaveCount(0);
          await expect(slug).toHaveValue("preserve-help-input");
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(mobile ? 320 : 1280);
      await page.screenshot({ path: testInfo.outputPath(`review-${locale}-${theme}.png`), fullPage: true });
    });
  }

  test(`hover, focus and outside dismissal: ${locale}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("mobile"), "Hover is a mouse interaction.");
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard/studio/listings/new`);
    const help = page.getByRole("button", { name: `${locale === "fa" ? "راهنما" : "Help"}: ${copy[locale].creatorDraft.slug}`, exact: true });
    await help.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);
    await help.focus();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(help).toBeFocused();
    await help.click();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(tooltip).toHaveCount(0);
  });

  test(`dashboard and studio expose contextual help: ${locale}`, async ({ page }) => {
    const prefix = locale === "fa" ? "/fa" : "";
    for (const route of ["/dashboard", "/dashboard/studio", "/dashboard/settings"]) {
      await page.goto(`${prefix}${route}`);
      const help = page.locator("main").getByRole("button", { name: locale === "fa" ? /^راهنما:/ : /^Help:/ }).first();
      await help.click();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await inViewport(page.getByRole("tooltip"));
      await page.keyboard.press("Escape");
    }
  });

  test(`landscape help stays clear of its field and keyboard dismissal works: ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard/studio/listings/new`);
    const slug = page.locator('[name="slug"]');
    const help = page.getByRole("button", { name: `${locale === "fa" ? "راهنما" : "Help"}: ${copy[locale].creatorDraft.slug}`, exact: true });
    await help.click();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await inViewport(tooltip);
    const fieldBox = await slug.boundingBox();
    const helpBox = await tooltip.boundingBox();
    expect(helpBox!.y + helpBox!.height <= fieldBox!.y || helpBox!.y >= fieldBox!.y + fieldBox!.height).toBe(true);
    await page.keyboard.press("Tab");
    await expect(tooltip).toHaveCount(0);
  });

  test(`save help clears the whole sticky action bar: ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard/studio/listings/new`);
    await page.locator('[name="slug"]').fill("keep-help-draft");
    const actions = page.locator("[data-draft-actions]");
    await actions.locator("button[aria-label]").click();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip.locator("bdi")).toBeVisible();
    await inViewport(tooltip);
    const bar = await actions.boundingBox();
    const bubble = await tooltip.boundingBox();
    expect(bubble!.y + bubble!.height <= bar!.y || bubble!.y >= bar!.y + bar!.height).toBe(true);
    for (const button of await actions.locator("button:not([disabled]), a").all()) {
      expect(await button.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      })).toBe(true);
    }
  });
}
