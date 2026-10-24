import { expect, test } from "@playwright/test";
import { copy } from "../lib/i18n";
import { creatorWorkspace } from "../features/creator/workspace-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) for (const previous of ["published", "submitted", "draft"]) {
  test(`archive/restore preserves ${previous} and recovers blockers (${locale})`, async ({ page }) => {
    const hub = { ...copy[locale].creatorHub, ...creatorWorkspace[locale].creatorHub };
    let state = previous, version = 1, archived = false, restoreAttempts = 0, archiveAttempts = 0;
    await page.route("**/api/marketplace/creator/dashboard?*", async (route) => {
      const result = await (await route.fetch()).json();
      const listing = result.data.listings[0];
      Object.assign(listing, { state, lifecycleVersion: version, published: state !== "archived" && previous === "published", restoreTarget: archived ? { state: previous, published: previous === "published" } : null });
      result.data.summary.publishedListings = result.data.listings.filter((item: { published: boolean }) => item.published).length;
      result.data.summary.inReviewListings = result.data.listings.filter((item: { state: string }) => ["submitted", "approved"].includes(item.state)).length;
      await route.fulfill({ json: result });
    });
    await page.route("**/api/marketplace/creator/products/listing-1/lifecycle", async (route) => {
      const action = archived ? "RESTORE" : "ARCHIVE";
      expect(route.request().postDataJSON()).toEqual({ action, expectedVersion: version });
      if (action === "ARCHIVE") { archiveAttempts++; state = "archived"; archived = true; }
      else {
        restoreAttempts++;
        if (previous === "published" && restoreAttempts === 1) return route.fulfill({ status: 409, json: { error: { code: "SOURCE_VERIFICATION_REQUIRED", message: "Approved source required" } } });
        if (restoreAttempts === (previous === "published" ? 2 : 1)) { version++; return route.fulfill({ status: 409, json: { error: { code: "LISTING_VERSION_CONFLICT", message: "Changed" } } }); }
        state = previous; archived = false;
      }
      version++;
      await route.fulfill({ json: { data: { state, version, published: !archived && previous === "published" } } });
    });
    await page.goto(`${locale === "fa" ? "/fa" : ""}/dashboard/studio`);
    const listing = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "PR Reviewer" }) });
    const archive = listing.getByRole("button", { name: hub.archiveListing });
    await archive.click();
    await expect(listing.getByText(hub.archiveHelp)).toBeVisible();
    await listing.getByRole("button", { name: hub.cancelArchive }).click();
    await expect(archive).toBeFocused();
    expect(archiveAttempts).toBe(0);
    await archive.click(); await listing.getByRole("button", { name: hub.confirmArchive }).click();
    await expect(listing.getByRole("status")).toHaveText(hub.archiveSuccess);
    const restore = listing.getByRole("button", { name: hub.restoreListing });
    await expect(restore).toBeEnabled();
    await expect(listing.getByRole("link", { name: hub.viewPublic })).toHaveCount(0);
    await expect(page.getByText(hub.publishedListings, { exact: true }).locator("..").locator("dd")).toHaveText(locale === "fa" ? "۰" : "0");
    await restore.click();
    await expect(listing.getByRole("region", { name: hub.restoreListing })).toContainText(previous === "published" ? hub.restorePublicHelp : hub.restorePrivateHelp);
    await listing.getByRole("button", { name: hub.cancelRestore }).click(); expect(restoreAttempts).toBe(0);
    await restore.click(); await listing.getByRole("button", { name: hub.confirmRestore }).click();
    if (previous === "published") {
      await expect(listing.getByRole("alert")).toContainText(hub.restoreSourceRequired);
      await expect(listing.getByRole("alert").getByRole("link", { name: hub.manageReleases })).toBeVisible();
      await listing.getByRole("button", { name: hub.confirmRestore }).click();
    }
    await expect(listing.getByRole("alert")).toContainText(hub.archiveConflict);
    await expect(listing.getByRole("button", { name: hub.confirmRestore })).toBeDisabled();
    await listing.getByRole("alert").getByRole("button", { name: hub.retry }).click();
    await expect(listing.getByRole("button", { name: hub.confirmRestore })).toBeEnabled();
    await listing.getByRole("button", { name: hub.confirmRestore }).click();
    await expect(listing.getByRole("status")).toHaveText(hub.restoreSuccess);
    await expect(listing.getByRole("heading", { name: "PR Reviewer" }).locator("..").getByText(previous === "published" ? hub.statusPublished : previous === "submitted" ? hub.statusSubmitted : hub.statusDraft, { exact: true })).toBeVisible();
    await expect(listing.getByRole("link", { name: hub.viewPublic })).toHaveCount(previous === "published" ? 1 : 0);
    await expect(page.getByText(hub.inReviewListings, { exact: true }).locator("..").locator("dd")).toHaveText(new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(previous === "submitted" ? 2 : 1));
    expect(archiveAttempts).toBe(1); expect(restoreAttempts).toBe(previous === "published" ? 3 : 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("staff archives and suspended listings offer no creator archive or restore override", async ({ page }) => {
  const hub = creatorWorkspace.en.creatorHub;
  await page.route("**/api/marketplace/creator/dashboard?*", async (route) => {
    const result = await (await route.fetch()).json();
    result.data.listings.forEach((listing: { state: string; published: boolean; restoreTarget: null }, index: number) => {
      Object.assign(listing, { state: index === 0 ? "suspended" : "archived", published: false, restoreTarget: null });
    });
    await route.fulfill({ json: result });
  });
  await page.goto("/dashboard/studio");
  await expect(page.getByRole("heading", { name: "PR Reviewer" })).toBeVisible();
  await expect(page.getByRole("button", { name: hub.archiveListing })).toHaveCount(0);
  await expect(page.getByRole("button", { name: hub.restoreListing })).toHaveCount(0);
  await expect(page.getByText(hub.restoreUnavailable)).toHaveCount(2);
});
