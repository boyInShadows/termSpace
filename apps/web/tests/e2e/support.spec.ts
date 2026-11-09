import { expect, test } from "@playwright/test";
import { supportCopy } from "../../features/support/support-copy";

for (const locale of ["en", "fa"] as const) {
  test(`private support creation, replies and resolution (${locale})`, async ({ page, context, baseURL }) => {
    const c = supportCopy[locale];
    const prefix = locale === "fa" ? "/fa" : "";
    await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
    await page.goto(`${prefix}/support/new`);
    await expect(page.locator("main#content")).toHaveCount(1);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.classList.toggle("dark", theme === "dark"); }, theme);
      const colors = await page.locator("#ticket-body").evaluate(field => {
        const context = document.createElement("canvas").getContext("2d")!;
        const pixel = (color: string) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data];
        };
        return { border: pixel(getComputedStyle(field).borderTopColor), input: pixel(getComputedStyle(field).getPropertyValue("--input")) };
      });
      expect(colors.border).toEqual(colors.input);
    }
    await page.getByLabel(c.subject, { exact: true }).fill("Cannot open a listing");
    await page.getByRole("textbox", { name: c.message, exact: true }).fill("The latest release fails to open from my library.");
    await page.getByLabel(c.screenshots).setInputFiles({ name: "screen.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==", "base64") });
    await expect(page.getByRole("img", { name: `${c.screenshot} 1`, exact: true })).toBeVisible();
    await page.getByRole("button", { name: c.send, exact: true }).click();
    await expect(page).toHaveURL(/\/support\/[a-f0-9-]+$/);
    const ticketURL = page.url();
    await expect(page.getByRole("heading", { name: "Cannot open a listing" })).toBeVisible();
    const screenshot = page.getByRole("img", { name: `${c.screenshot} 1`, exact: true });
    await expect(screenshot).toBeVisible();
    const source = await screenshot.getAttribute("src");
    await expect.poll(async () => (await page.request.get(source!)).status()).toBe(200);
    await page.getByRole("textbox", { name: c.message, exact: true }).fill("More details from the member.");
    await page.getByRole("button", { name: c.reply, exact: true }).click();
    await expect(page.getByText("More details from the member.", { exact: true })).toBeVisible();
    await context.addCookies([{ name: "e2e_persona", value: "admin", url: baseURL! }]);
    const adminURL = ticketURL.replace("/support/", "/support/admin/");
    await page.goto(adminURL);
    await page.getByRole("textbox", { name: c.message, exact: true }).fill("Please try opening it again.");
    await page.getByRole("button", { name: c.reply, exact: true }).click();
    await expect(page.getByText(c.staffWaiting, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: c.resolve, exact: true }).click();
    await expect(page.getByRole("status")).toHaveText(c.staffResolved);
    await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
    await page.goto(ticketURL);
    await page.getByRole("textbox", { name: c.message, exact: true }).fill("The problem remains, please reopen.");
    await page.getByRole("button", { name: c.reply, exact: true }).click();
    await expect(page.getByText(c.statuses.WAITING_FOR_SUPPORT, { exact: true })).toBeVisible();
  });
}
