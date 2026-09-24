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
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(3);
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
});
