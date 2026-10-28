import { expect, test } from "@playwright/test";
import { accountDataCopy } from "../features/dashboard/account-data-copy";

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const text = accountDataCopy[locale];

  test.describe(`account data (${locale})`, () => {
    const persona = (name: string) => async ({ context, baseURL }: { context: import("@playwright/test").BrowserContext; baseURL: string | undefined }) => {
      await context.addCookies([{ name: "e2e_persona", value: name, url: baseURL! }]);
    };

    test("downloads the account data from Settings", async ({ page, context, baseURL }) => {
      await persona("reader")({ context, baseURL });
      await page.goto(`${prefix}/dashboard/settings`);
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: text.exportButton }).click();
      expect((await download).suggestedFilename()).toBe("termspace-account-export.json");
      await expect(page.getByText(text.exported)).toBeVisible();
    });

    test("deletes the account only after the typed email and password are accepted", async ({ page, context, baseURL }) => {
      await persona("reader")({ context, baseURL });
      await page.goto(`${prefix}/dashboard/settings`);
      const remove = page.getByRole("button", { name: text.deleteButton });
      await expect(remove).toBeDisabled();
      await page.getByLabel(text.confirmLabel).fill("reader@e2e.test");
      await page.getByLabel(text.passwordLabel).fill("wrong-password");
      await remove.click();
      await expect(page.getByRole("alert").filter({ hasText: text.invalidPassword })).toBeVisible();
      await page.getByLabel(text.passwordLabel).fill("correct-password");
      await remove.click();
      await expect(page).toHaveURL(new RegExp(`${prefix}/?$`));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test("sends a creator with live listings to the studio", async ({ page, context, baseURL }) => {
      await persona("creator")({ context, baseURL });
      await page.goto(`${prefix}/dashboard/settings`);
      await page.getByLabel(text.confirmLabel).fill("creator@e2e.test");
      await page.getByLabel(text.passwordLabel).fill("correct-password");
      await page.getByRole("button", { name: text.deleteButton }).click();
      await expect(page.getByRole("alert").filter({ hasText: text.creatorBlocked })).toBeVisible();
      await expect(page.getByRole("link", { name: text.studioLink })).toHaveAttribute("href", `${prefix}/dashboard/studio`);
    });
  });
}
