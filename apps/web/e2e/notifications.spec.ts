import { expect, test } from "@playwright/test";
import { notificationsCopy } from "../features/dashboard/notifications-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const text = notificationsCopy[locale];
  const prefix = locale === "fa" ? "/fa" : "";

  test(`moderation decisions appear in the dashboard and can be marked read (${locale})`, async ({ page }) => {
    let read = false;
    const createdAt = "2026-11-01T09:00:00.000Z";
    await page.route("**/api/marketplace/notifications", async (route) => {
      await route.fulfill({
        json: {
          data: {
            unread: read ? 0 : 1,
            notifications: [{
              id: "notification-1",
              type: "changes_requested",
              productName: "Owned Skill",
              productSlug: "owned-skill",
              publicReason: "Clarify what the skill reads.",
              readAt: read ? createdAt : null,
              createdAt,
            }],
          },
        },
      });
    });
    await page.route("**/api/marketplace/notifications/read", async (route) => {
      read = true;
      await route.fulfill({ json: { data: { updated: 1, unread: 0 } } });
    });

    await page.goto(`${prefix}/dashboard`);
    const trigger = page.getByRole("button", { name: `${text.label} (${text.unread(1)})` });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const panel = page.locator("[data-notifications]");
    await expect(page.getByRole("heading", { name: text.title })).toBeVisible();
    await expect(panel.getByText("Owned Skill")).toBeVisible();
    await expect(panel.getByText(text.changes_requested)).toBeVisible();
    await expect(panel.getByText(`${text.reviewerNote}: Clarify what the skill reads.`)).toBeVisible();

    await panel.getByRole("button", { name: text.markAllRead }).click();
    await expect(panel.getByRole("status")).toHaveText(text.markedAll);
    await expect(page.getByRole("button", { name: text.label })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: text.label })).toBeVisible();
    await page.getByRole("button", { name: text.label }).click();
    await expect(page.getByText("Owned Skill")).toBeVisible();
  });
}
