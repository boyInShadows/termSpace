import { expect, test } from "@playwright/test";
import { savedCopy } from "../features/library/saved-copy";
import { copy } from "../lib/i18n";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});

test.describe("cold dashboard clock", () => {
  test.use({ timezoneId: "Pacific/Kiritimati" });

  test("hydrates without replacing server text in another timezone", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat|#418/i.test(message.text())) errors.push(message.text());
    });
    await page.goto("/dashboard");
    await expect(page.getByRole("table")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const summary = copy[locale].dashboardHome.summary.replace("{week}", number.format(9)).replace("{review}", number.format(1)).replace("{acquisitions}", number.format(48)).replace("{listings}", number.format(3));

  test(`summary and totals paint before framework JavaScript (${locale})`, async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto(`${prefix}/dashboard`);
    const main = page.getByRole("main");
    await expect(main.getByText(summary, { exact: true })).toBeVisible();
    for (const [label, value] of [
      [copy[locale].dashboardHome.statAcquisitions7d, number.format(9)],
      [copy[locale].dashboardHome.statRating, number.format(4.6)],
    ]) {
      await expect(main.getByText(label, { exact: true }).locator("..").locator("dd > span").first()).toHaveText(value);
    }
  });

  test(`server identity lets overview load during browser revalidation (${locale})`, async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    let validating = false;
    await page.route("**/api/readers/session", async (route) => {
      validating = true;
      await held;
      await route.continue();
    });
    try {
      await page.goto(`${prefix}/dashboard`);
      await expect(page.getByRole("table")).toBeVisible();
      expect(validating).toBe(true);
    } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
  });

  test(`server identity is request-scoped and absent from public HTML (${locale})`, async ({ request }) => {
    const creator = await request.get(`${prefix}/dashboard`, { headers: { Cookie: "e2e_persona=creator" } });
    expect(creator.headers()["cache-control"]).toContain("no-store");
    const creatorHtml = await creator.text();
    expect(creatorHtml.includes("creator@e2e.test")).toBe(true);
    expect(creatorHtml.includes(summary)).toBe(true);
    const empty = await request.get(`${prefix}/dashboard`, { headers: { Cookie: "e2e_persona=empty" } });
    const emptyHtml = await empty.text();
    expect(emptyHtml).toContain("empty@e2e.test");
    expect(emptyHtml).not.toContain("creator@e2e.test");
    const publicHtml = await (await request.get(`${prefix}/explore`, { headers: { Cookie: "e2e_persona=creator", "x-term-path": "/dashboard" } })).text();
    expect(publicHtml.includes("creator@e2e.test")).toBe(false);
  });

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
      await expect.poll(() => reads).toBe(1);
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
