import { expect, test } from "@playwright/test";
import { creatorWorkspace } from "../features/creator/workspace-copy";

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const hub = creatorWorkspace[locale].creatorHub;

  test.describe(`studio guidance and feedback (${locale})`, () => {
    test("a creator with no listings sees the four-step guide and where to start", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "e2e_persona", value: "empty", url: baseURL! }]);
      await page.goto(`${prefix}/dashboard/studio`);
      for (const title of [hub.onboardingTitle1, hub.onboardingTitle2, hub.onboardingTitle3, hub.onboardingTitle4]) {
        await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      }
      await expect(page.getByRole("main").getByRole("link", { name: hub.connectSource })).toHaveAttribute("href", `${prefix}/dashboard/settings?section=connections`);
      await expect(page.getByText(/next part of the workspace/i)).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test("a published listing shows its last-30-day acquisitions and recent reader reviews", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
      await page.goto(`${prefix}/dashboard/studio`);
      const card = page.getByRole("article").filter({ hasText: "PR Reviewer" });
      await expect(card.getByText(hub.acquisitionsLast30Days, { exact: true })).toBeVisible();
      await expect(card.getByText(hub.reachLast30Days)).toBeVisible();
      await expect(card.getByText(hub.viewsPrivacy)).toBeVisible();
      await expect(card.getByRole("img", { name: new RegExp(hub.viewTrendLabel) })).toBeVisible();
      await expect(card.getByRole("heading", { name: hub.recentReviews })).toBeVisible();
      await expect(card.getByText("Saved me an afternoon of review churn.")).toBeVisible();
      await expect(card.getByRole("link", { name: hub.readAllReviews })).toHaveAttribute("href", `${prefix}/products/fixture-listing-1#reviews`);
      // A listing that is not live yet has nothing to show, so it shows nothing.
      await expect(page.getByRole("article").filter({ hasText: "Schema Linter" }).getByRole("heading", { name: hub.recentReviews })).toHaveCount(0);
      await expect(page.getByRole("article").filter({ hasText: "Schema Linter" }).getByRole("img", { name: new RegExp(hub.viewTrendLabel) })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}
