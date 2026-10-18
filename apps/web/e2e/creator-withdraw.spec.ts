import { expect, test } from "@playwright/test";
import { copy } from "../lib/i18n";
import { creatorWorkspace } from "../features/creator/workspace-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});

for (const locale of ["en", "fa"] as const) {
  test(`withdrawal cancels, recovers conflicts and refreshes the saved draft (${locale})`, async ({ page }) => {
    const hub = { ...copy[locale].creatorHub, ...creatorWorkspace[locale].creatorHub };
    let attempts = 0;
    let version = 1;
    let withdrawn = false;
    await page.route("**/api/marketplace/creator/dashboard?*", async (route) => {
      const result = await (await route.fetch()).json();
      const listing = result.data.listings.find((item: { id: string }) => item.id === "listing-2");
      listing.lifecycleVersion = version;
      listing.published = true;
      if (withdrawn) {
        listing.state = "draft";
        result.data.summary.inReviewListings = 0;
      }
      await route.fulfill({ json: result });
    });
    await page.route("**/api/marketplace/creator/products/listing-2/lifecycle", async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ action: "WITHDRAW", expectedVersion: version });
      attempts += 1;
      if (attempts === 1) return route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "Offline" } } });
      if (attempts === 2) {
        version = 2;
        return route.fulfill({ status: 409, json: { error: { code: "LISTING_VERSION_CONFLICT", message: "Changed" } } });
      }
      version = 3;
      withdrawn = true;
      return route.fulfill({ json: { data: { state: "draft", version, published: true } } });
    });
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard/studio`);
    const listing = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Schema Linter" }) });
    await expect(page.getByRole("button", { name: hub.withdrawReview })).toHaveCount(1);
    await listing.getByRole("button", { name: hub.withdrawReview }).click();
    await expect(listing.getByText(hub.withdrawalHelp)).toBeVisible();
    await listing.getByRole("button", { name: hub.keepInReview }).click();
    expect(attempts).toBe(0);
    await listing.getByRole("button", { name: hub.withdrawReview }).click();
    await listing.getByRole("button", { name: hub.confirmWithdrawal }).click();
    await expect(listing.getByRole("alert")).toContainText(hub.withdrawalError);
    await listing.getByRole("button", { name: hub.confirmWithdrawal }).click();
    await expect(listing.getByRole("alert")).toContainText(hub.withdrawalConflict);
    await expect(listing.getByRole("button", { name: hub.confirmWithdrawal })).toBeDisabled();
    await listing.getByRole("alert").getByRole("button", { name: hub.retry }).click();
    await expect(listing.getByRole("button", { name: hub.confirmWithdrawal })).toBeEnabled();
    await listing.getByRole("button", { name: hub.confirmWithdrawal }).click();
    await expect(listing.getByRole("status")).toHaveText(hub.withdrawalSuccess);
    await expect(listing.getByText(hub.statusDraft, { exact: true })).toBeVisible();
    await expect(page.getByText(hub.inReviewListings, { exact: true }).locator("..").locator("dd")).toHaveText(locale === "fa" ? "۰" : "0");
    await expect(listing.getByRole("link", { name: hub.editDraft })).toHaveAttribute("href", `${locale === "fa" ? "/fa" : ""}/dashboard/studio/listings/listing-2/edit`);
    await expect(listing.getByRole("link", { name: hub.viewPublic })).toBeVisible();
    await expect(page.getByRole("button", { name: hub.withdrawReview })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(attempts).toBe(3);
  });
}
