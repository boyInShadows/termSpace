import { expect, test, type BrowserContext } from "@playwright/test";

async function signInAs(context: BrowserContext, baseURL: string, persona: "creator" | "empty") {
  await context.addCookies([{ name: "e2e_persona", value: persona, url: baseURL }]);
}

test.describe("dashboard", () => {
  test("sends a signed-out visitor to sign in, then back to the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/account\?next=%2Fdashboard$/);

    await page.getByLabel("Email").fill("creator@e2e.test");
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("table").locator("tbody tr td:first-child a span.truncate")).toHaveCount(3);
  });

  test("shows the empty state to a creator with no listings", async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, "empty");
    await page.goto("/dashboard");

    await expect(page.getByText("Nothing published yet.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Publish your first listing" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("Ctrl+K moves focus to the dashboard search", async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("mobile"), "The top-bar search is hidden below md.");
    await signInAs(context, baseURL!, "creator");
    await page.goto("/dashboard");
    await expect(page.getByRole("table")).toBeVisible();

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator("#dashboard-search")).toBeFocused();
  });

  test("the old /creator addresses redirect into the dashboard studio", async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, "creator");
    await page.goto("/creator");
    await expect(page).toHaveURL(/\/dashboard\/studio$/);
    await expect(page.getByRole("heading", { name: "Your work on TermSpace" })).toBeVisible();

    await page.goto("/creator/listings/new");
    await expect(page).toHaveURL(/\/dashboard\/studio\/listings\/new$/);
    // Inside the dashboard shell, not the marketing site's header and footer.
    await expect(page.getByRole("contentinfo")).toHaveCount(0);

    await page.goto("/fa/creator");
    await expect(page).toHaveURL(/\/fa\/dashboard\/studio$/);
  });

  for (const path of ["/explore", "/fa/explore"]) {
    test(`the signed-in header keeps its nav on one line at 768px (${path})`, async ({ page, context, baseURL }, testInfo) => {
      test.skip(testInfo.project.name.startsWith("mobile"), "Checks a fixed 768px viewport.");
      await signInAs(context, baseURL!, "creator");
      await page.setViewportSize({ width: 768, height: 900 });
      await page.goto(path);
      const links = page.locator("header nav").first().getByRole("link");
      await expect(links).toHaveCount(2);
      for (const height of await links.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))) {
        expect(height).toBeLessThan(40);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(768);
    });
  }

  test("listing names stay readable on a phone, and a listing needing changes shows why", async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("desktop"), "Checks a phone-width viewport.");
    await signInAs(context, baseURL!, "creator");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const names = page.getByRole("table").locator("tbody tr td:first-child a span.truncate");
    await expect(names).toHaveCount(3);
    for (const width of await names.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))) {
      expect(width).toBeGreaterThan(60);
    }
    await expect(page.getByRole("table").getByText("State what the skill reads.")).toBeVisible();
    await expect(page.getByRole("table").getByRole("link", { name: "Edit draft" })).toBeVisible();
  });
});
