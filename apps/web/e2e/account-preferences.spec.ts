import { expect, test } from "@playwright/test";
import { accountPreferencesCopy } from "../features/dashboard/account-preferences-copy";
import { copy } from "../lib/i18n";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const text = accountPreferencesCopy[locale];
  const path = `${locale === "fa" ? "/fa" : ""}/dashboard/settings`;

  test(`newsletter preference loads, toggles from the keyboard and persists (${locale})`, async ({ page }) => {
    let subscribed = true;
    await page.route("**/api/readers/preferences", async (route) => {
      if (route.request().method() === "PATCH") subscribed = Boolean(route.request().postDataJSON().newsletter);
      await route.fulfill({ json: { data: { newsletter: subscribed, moderation: true } } });
    });
    await page.goto(path);
    const panel = page.getByRole("region", { name: text.title, exact: true });
    const toggle = panel.getByRole("switch", { name: text.newsletter });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(panel.getByText(text.on, { exact: true }).first()).toBeVisible();

    await toggle.focus();
    await page.keyboard.press("Space");

    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(panel.getByRole("status")).toHaveText(text.unsubscribed);
    await expect(panel.getByText(text.off, { exact: true }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("region", { name: text.title, exact: true }).getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
  });

  test(`failed newsletter change keeps the switch and names the recovery (${locale})`, async ({ page }) => {
    await page.route("**/api/readers/preferences", async (route) => {
      if (route.request().method() === "PATCH") return route.fulfill({ status: 500, json: { error: { code: "FAILED", message: "fixture" } } });
      await route.fulfill({ json: { data: { newsletter: true, moderation: true } } });
    });
    await page.goto(path);
    const panel = page.getByRole("region", { name: text.title, exact: true });
    const toggle = panel.getByRole("switch", { name: text.newsletter });
    await toggle.click();

    await expect(panel.getByRole("alert")).toHaveText(copy[locale].serviceError);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test(`a failed preference load offers Retry instead of a guessed state (${locale})`, async ({ page }) => {
    let calls = 0;
    await page.route("**/api/readers/preferences", async (route) => {
      calls++;
      if (calls === 1) return route.fulfill({ status: 500, json: { error: { code: "FAILED", message: "fixture" } } });
      await route.fulfill({ json: { data: { newsletter: false, moderation: true } } });
    });
    await page.goto(path);
    const panel = page.getByRole("region", { name: text.title, exact: true });
    await expect(panel.getByRole("alert")).toHaveText(text.loadError);
    await expect(panel.getByRole("switch")).toHaveCount(0);

    await panel.getByRole("button", { name: text.retry }).click();

    await expect(panel.getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
  });
}
