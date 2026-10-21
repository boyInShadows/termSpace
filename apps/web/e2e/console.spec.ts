import { expect, test } from "@playwright/test";

/**
 * A signed-out visitor's page views should leave the console empty, so a real
 * error stands out. The session check used to answer 401 for an anonymous
 * caller, which the browser logs as an error on every page.
 */
const PAGES = ["/", "/explore", "/products/conversion-copywriter", "/account", "/fa", "/fa/explore"];

for (const path of PAGES) {
  test(`${path} logs no console errors or failed requests when signed out`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      // The software WebGL used by headless Chrome reports driver performance notes.
      if (["error", "warning"].includes(message.type()) && !message.text().includes("GL Driver Message")) {
        problems.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) problems.push(`${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`);
    });
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    expect(problems).toEqual([]);
  });
}

test("the page declares an icon, so browsers do not request a missing /favicon.ico", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('head link[rel~="icon"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  expect((await request.get(href!)).status()).toBe(200);
});
