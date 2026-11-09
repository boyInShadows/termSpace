import { expect, test } from "@playwright/test";
import { notificationsCopy } from "../features/dashboard/notifications-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const text = notificationsCopy[locale];
  const prefix = locale === "fa" ? "/fa" : "";

  test(`support alerts open their private thread and keep moderation visible (${locale})`, async ({ page }) => {
    const created = await page.request.post("/backend/api/support/tickets", { data: {
      category: "GENERAL", subject: "Synthetic support ticket", body: "A synthetic support conversation for notification navigation.",
    } });
    expect(created.status()).toBe(201);
    const ticketId = (await created.json()).data.id as string;
    let read = false;
    await page.route("**/api/marketplace/notifications", route => route.fulfill({ json: { data: { unread: read ? 1 : 2, notifications: [
      { id: "support-alert", type: "support_reply", ticketId, staff: false, readAt: read ? new Date().toISOString() : null, createdAt: new Date().toISOString() },
      { id: "moderation-alert", type: "approved", productName: "Owned Skill", productSlug: "owned-skill", publicReason: null, readAt: null, createdAt: new Date().toISOString() },
    ] } } }));
    await page.route("**/api/marketplace/notifications/read", async route => {
      read = route.request().postDataJSON().ids?.includes("support-alert") ?? false;
      await route.fulfill({ json: { data: { updated: 1, unread: 1 } } });
    });
    await page.goto(`${prefix}/dashboard`);
    await page.getByRole("button", { name: `${text.label} (${text.unread(2)})` }).click();
    await expect(page.locator("[data-notifications]").getByText("Owned Skill")).toBeVisible();
    await page.getByRole("link", { name: new RegExp(text.supportTitle) }).click();
    await expect(page).toHaveURL(`${prefix}/support/${ticketId}`);
    await expect(page.getByRole("heading", { name: "Synthetic support ticket" })).toBeVisible();
    await expect.poll(() => read).toBe(true);
  });

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
