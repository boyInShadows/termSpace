import { expect, test } from "@playwright/test";
import { accountSecurityCopy } from "../features/dashboard/account-security-copy";
import { copy } from "../lib/i18n";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const text = accountSecurityCopy[locale];
  const path = `${locale === "fa" ? "/fa" : ""}/dashboard/settings`;

  test(`keyboard focus keeps the password action above the tablet tab bar (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(path);
    const panel = page.getByRole("region", { name: text.title, exact: true });
    await panel.getByLabel(text.currentPassword).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const action = panel.getByRole("button", { name: text.savePassword, exact: true });
    await expect(action).toBeFocused();
    await expect.poll(() => action.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest("button") === node;
    })).toBe(true);
  });

  test(`password confirmation, invalid-current recovery and successful clearing (${locale})`, async ({ page }) => {
    const panel = page.getByRole("region", { name: text.title, exact: true });
    let calls = 0;
    await page.route("**/api/readers/profile/password", async (route) => {
      calls++;
      expect(route.request().method()).toBe("PUT");
      const body = route.request().postDataJSON();
      expect(body).toEqual({ currentPassword: calls === 1 ? "fixture-wrong" : "fixture-current", newPassword: "fixture-next-password" });
      await route.fulfill(calls === 1
        ? { status: 401, json: { error: { code: "INVALID_CURRENT_PASSWORD", message: "fixture" } } }
        : { json: { data: { updated: true } } });
    });
    await page.goto(path);
    await page.getByLabel(text.currentPassword).fill("fixture-wrong");
    await page.getByLabel(copy[locale].newPassword).fill("fixture-next-password");
    await page.getByLabel(copy[locale].confirmPassword).fill("different-password");
    await page.getByRole("button", { name: text.savePassword, exact: true }).click();
    await expect(panel.getByRole("alert")).toHaveText(copy[locale].passwordMismatch);
    expect(calls).toBe(0);
    await page.getByLabel(copy[locale].confirmPassword).fill("fixture-next-password");
    await page.getByRole("button", { name: text.savePassword, exact: true }).click();
    await expect(panel.getByRole("alert")).toHaveText(text.invalidCurrent);
    await page.getByLabel(text.currentPassword).fill("fixture-current");
    await page.getByRole("button", { name: text.savePassword, exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText(text.saved);
    for (const label of [text.currentPassword, copy[locale].newPassword, copy[locale].confirmPassword]) await expect(page.getByLabel(label)).toHaveValue("");
    expect(calls).toBe(2);
  });

  test(`Google-only accounts expose their sign-in method without password setup (${locale})`, async ({ page }) => {
    await page.route("**/api/readers/profile", (route) => route.fulfill({ json: { data: { createdAt: "2026-01-01T00:00:00Z", hasPassword: false, connectedGoogle: true } } }));
    await page.goto(path);
    await expect(page.getByText(text.googleSignIn, { exact: true })).toBeVisible();
    await expect(page.getByText(text.noPasswordIntro)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test(`security profile failure has a working Retry (${locale})`, async ({ page }) => {
    const panel = page.getByRole("region", { name: text.title, exact: true });
    let calls = 0;
    await page.route("**/api/readers/profile", (route) => {
      calls++;
      return route.fulfill(calls <= 2
        ? { status: 503, json: { error: { code: "UNAVAILABLE", message: "fixture" } } }
        : { json: { data: { createdAt: "2026-01-01T00:00:00Z", hasPassword: true, connectedGoogle: false } } });
    });
    await page.goto(path);
    await expect(panel.getByRole("alert")).toHaveText(text.loadError);
    await page.getByRole("button", { name: copy[locale].dashboardHome.retry, exact: true }).click();
    await expect(page.getByLabel(text.currentPassword)).toBeVisible();
    expect(calls).toBe(3);
  });
}
