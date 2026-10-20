import { expect, test } from "@playwright/test";
import { savedCopy } from "../features/library/saved-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";

  test(`overview loads before a delayed favorites response (${locale})`, async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/marketplace/favorites", async (route) => {
      await held;
      await route.fulfill({ json: { data: [] } });
    });
    try {
      await page.goto(`${prefix}/dashboard`);
      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.locator("[data-site-header]")).toHaveCount(1);
    } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
  });

  test(`Saved cannot mutate before the session snapshot, and removal stays removed (${locale})`, async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    let reads = 0;
    let removed = false;
    await page.route("**/api/marketplace/favorites", async (route) => {
      if (++reads === 1) await held;
      await route.fulfill({ json: { data: removed ? [] : ["conversion-copywriter"] } });
    });
    await page.route("**/api/marketplace/products/conversion-copywriter/favorite", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      removed = true;
      await route.fulfill({ json: { data: {} } });
    });
    try {
      await page.goto(`${prefix}/dashboard/library/saved`);
      const saved = page.getByRole("region", { name: savedCopy[locale].title });
      await expect(saved.getByRole("status")).toHaveText(savedCopy[locale].loading);
      await expect(saved.getByRole("button", { name: savedCopy[locale].remove })).toHaveCount(0);
      expect(reads).toBe(1);
      release();
      await saved.getByRole("button", { name: savedCopy[locale].remove }).click();
      await expect(saved.getByText(savedCopy[locale].empty, { exact: true })).toBeVisible();
      await page.goto(`${prefix}/dashboard/library/saved`);
      await expect(page.getByText(savedCopy[locale].empty, { exact: true })).toBeVisible();
    } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
  });

  test(`a session expiring during favorites still leaves the workspace (${locale})`, async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/marketplace/favorites", async (route) => {
      await held;
      await route.fulfill({ status: 401, json: { error: { code: "UNAUTHORIZED", message: "Sign in" } } });
    });
    try {
      await page.goto(`${prefix}/dashboard`);
      await expect(page.getByRole("table")).toBeVisible();
      release();
      await expect(page).toHaveURL(new RegExp(`${prefix}/account\\?next=%2F${locale === "fa" ? "fa%2F" : ""}dashboard$`));
      await expect(page.getByRole("table")).toHaveCount(0);
    } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
  });
}
