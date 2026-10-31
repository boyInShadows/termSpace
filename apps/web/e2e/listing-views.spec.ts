import { expect, test } from "@playwright/test";

/** The beacon is the only thing counting a view; it must fire once and carry nothing about the visitor. */
test("a listing page sends one view beacon with no body", async ({ page }) => {
  const bodies: Array<string | null> = [];
  await page.route("**/api/marketplace/products/*/views", async (route) => {
    expect(route.request().method()).toBe("POST");
    bodies.push(route.request().postData());
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/products/conversion-copywriter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect.poll(() => bodies.length, { timeout: 5_000 }).toBe(1);
  await page.waitForLoadState("networkidle");

  expect(bodies).toHaveLength(1);
  expect(bodies[0] ?? "").toBe("");
});

test("a visitor sending Do Not Track is not counted", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/marketplace/products/*/views", async (route) => {
    calls += 1;
    await route.fulfill({ status: 204, body: "" });
  });
  await page.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));

  await page.goto("/products/conversion-copywriter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(calls).toBe(0);
});

test("a visitor sending Global Privacy Control is not counted", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/marketplace/products/*/views", async (route) => {
    calls += 1;
    await route.fulfill({ status: 204, body: "" });
  });
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));

  await page.goto("/products/conversion-copywriter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(calls).toBe(0);
});
