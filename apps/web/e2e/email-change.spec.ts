import { expect, test } from "@playwright/test";
import { emailChangeCopy } from "../features/account/email-change-copy";

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const text = emailChangeCopy[locale];

  test.describe(`email change (${locale})`, () => {
    test("asks for the password, then says a confirmation link was sent", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
      await page.goto(`${prefix}/dashboard/settings`);
      await page.getByLabel(text.newEmailLabel).fill("new-address@e2e.test");
      await page.getByLabel(text.passwordLabel).fill("wrong-password");
      await page.getByRole("button", { name: text.submit }).click();
      await expect(page.getByRole("alert").filter({ hasText: text.invalidPassword })).toBeVisible();
      await page.getByLabel(text.passwordLabel).fill("correct-password");
      await page.getByRole("button", { name: text.submit }).click();
      await expect(page.getByText(text.sent)).toBeVisible();
      await expect(page.getByLabel(text.newEmailLabel)).toHaveValue("");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test("the emailed link confirms the change and removes the token from the address", async ({ page }) => {
      await page.goto(`${prefix}/account/confirm-email#token=valid-token`);
      await expect(page.getByText(text.changed)).toBeVisible();
      await expect(page).not.toHaveURL(/token=/);
      await expect(page.getByRole("main").getByRole("link", { name: text.signIn })).toHaveAttribute("href", `${prefix}/account`);
    });

    // Separate tests: moving between two hash-only URLs would not reload the page.
    test("explains an address that was taken in the meantime", async ({ page }) => {
      await page.goto(`${prefix}/account/confirm-email#token=taken-token`);
      await expect(page.getByRole("alert").filter({ hasText: text.unavailable })).toBeVisible();
    });

    test("explains an expired link and points back to Settings", async ({ page }) => {
      await page.goto(`${prefix}/account/confirm-email#token=expired-token`);
      await expect(page.getByRole("alert").filter({ hasText: text.invalid })).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: text.openSettings })).toHaveAttribute("href", `${prefix}/dashboard/settings`);
    });

    test("asks for the emailed link when opened without a token", async ({ page }) => {
      await page.goto(`${prefix}/account/confirm-email`);
      await expect(page.getByText(text.noToken)).toBeVisible();
    });
  });
}
