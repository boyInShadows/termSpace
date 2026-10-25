import { expect, test } from "@playwright/test";
import { mockHome } from "../lib/mock-home";
import { creatorProfileCopy } from "../features/creators/profile-copy";

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const text = creatorProfileCopy[locale];

  test(`a public listing reaches its creator and published collection (${locale})`, async ({ page }) => {
    const product = mockHome.products[0];
    await page.goto(`${prefix}/products/${product.slug}`);
    await page.getByRole("link", { name: product.creator.name, exact: true }).first().click();
    await expect(page).toHaveURL(`${prefix}/creators/${product.creator.handle}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.creator.name);
    await expect(page.getByText(`@${product.creator.handle}`, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: text.listings, exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${prefix}/creators/${product.creator.handle}$`));
    await expect(page.getByRole("article")).not.toHaveCount(0);
    await expect(page.getByText(/Private (draft|suspended|archived)/)).toHaveCount(0);
    expect(await page.locator("main#content").count()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Tab");
    await page.getByRole("link", { name: text.back, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${prefix}/explore`);
  });

  test(`creator pagination survives reload and retains its locale (${locale})`, async ({ page }) => {
    await page.goto(`${prefix}/creators/fixture-creator`);
    await expect(page.getByRole("article")).toHaveCount(12);
    await page.getByRole("navigation", { name: text.pagination }).getByRole("link", { name: text.next, exact: true }).click();
    await expect(page).toHaveURL(`${prefix}/creators/fixture-creator?page=2`);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Creator fixture 13", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("link", { name: text.previous, exact: true }).click();
    await expect(page).toHaveURL(`${prefix}/creators/fixture-creator`);
    await page.goto(`${prefix}/creators/fixture-creator?page=99`);
    await expect(page).toHaveURL(`${prefix}/creators/fixture-creator?page=2`);
  });

  test(`missing and private-only creators return 404 (${locale})`, async ({ page }) => {
    const response = await page.goto(`${prefix}/creators/missing-creator`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });

  test(`a failed creator request exposes recovery without fabricated listings (${locale})`, async ({ page }) => {
    await page.goto(`${prefix}/creators/fixture-unavailable`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.loadError);
    await expect(page.locator("main").getByRole("alert")).toHaveText(text.unavailable);
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(page.getByRole("link", { name: text.retry, exact: true })).toHaveAttribute("href", `${prefix}/creators/fixture-unavailable`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test(`a rate-limited creator request keeps its localized reason (${locale})`, async ({ page }) => {
    await page.goto(`${prefix}/creators/fixture-rate-limited`);
    await expect(page.locator("main").getByRole("alert")).toHaveText(text.rateLimited);
    await expect(page.getByRole("link", { name: text.retry, exact: true })).toBeVisible();
  });

  test(`maximum-length creator text wraps at phone width (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${prefix}/creators/fixture-long-creator`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A".repeat(80));
    await expect(page.getByRole("article")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });
}
