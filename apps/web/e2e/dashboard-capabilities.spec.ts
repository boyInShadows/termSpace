import { expect, test } from "@playwright/test";
import { copy } from "../lib/i18n";
import { savedCopy } from "../features/library/saved-copy";
import { libraryCopy } from "../features/library/library-copy";
import { creatorWorkspace } from "../features/creator/workspace-copy";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "empty", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const text = savedCopy[locale];
  const providers = creatorWorkspace[locale].creatorReleases;

  test(`Profile lives in the dashboard and the shared menu has no duplicate (${locale})`, async ({ page }, info) => {
    await page.goto(`${prefix}/dashboard`);
    await expect(page.getByRole("banner")).toHaveCount(1);
    const nav = page.getByRole("navigation", { name: info.project.name.startsWith("mobile") ? copy[locale].dashboardHome.tabsLabel : copy[locale].dashboard });
    await nav.getByRole("link", { name: copy[locale].profile, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: copy[locale].profile })).toBeVisible();
    await expect(page.locator("#dashboard-search")).toBeVisible();
    const header = page.locator("[data-site-header]");
    await header.getByRole("button", { name: info.project.name.startsWith("mobile") ? copy[locale].open : copy[locale].account, exact: true }).click();
    await expect(header.getByRole("link", { name: copy[locale].profile, exact: true })).toHaveCount(0);
    await expect(header.getByRole("link", { name: copy[locale].dashboard, exact: true })).toBeVisible();
  });

  test(`saved collection loads a page in one request, isolates unavailable items and removes them (${locale})`, async ({ page }) => {
    let slugs = Array.from({ length: 13 }, (_, index) => `saved-${index}`);
    const batches: string[][] = [];
    await page.route("**/api/marketplace/favorites", (route) => route.fulfill({ json: { data: slugs } }));
    // One request resolves a whole page; a listing that is not published is simply missing from it.
    await page.route((url) => url.pathname.endsWith("/api/marketplace/products") && url.searchParams.has("slugs"), (route) => {
      const requested = new URL(route.request().url()).searchParams.get("slugs")!.split(",");
      batches.push(requested);
      const data = requested.filter((slug) => slug !== "saved-1").map((slug) => ({ slug, name: slug === "saved-0" ? "R".repeat(80) : slug, outcome: "Public saved resource" }));
      return route.fulfill({ json: { data, meta: { page: 1, limit: requested.length, total: data.length, totalPages: 1 } } });
    });
    await page.route("**/api/marketplace/products/*/favorite", (route) => {
      expect(route.request().method()).toBe("DELETE");
      const slug = new URL(route.request().url()).pathname.split("/").at(-2)!;
      slugs = slugs.filter((value) => value !== slug);
      return route.fulfill({ status: 204 });
    });
    await page.goto(`${prefix}/dashboard/library`);
    await page.getByRole("link", { name: text.title, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "R".repeat(80), exact: true })).toBeVisible();
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(12);
    expect(batches[0]).not.toContain("saved-12");
    const unavailable = page.getByRole("listitem").filter({ hasText: text.unavailable });
    await unavailable.getByRole("button", { name: text.remove }).click();
    await expect(page.getByText(text.unavailable)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "saved-12", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: libraryCopy[locale].next })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`creator without listings connects and revokes from Profile (${locale})`, async ({ page }) => {
    let writes = 0;
    await page.route("**/api/marketplace/creator/provider-connections/github", (route) => {
      if (route.request().method() === "DELETE") return route.fulfill({ status: 204 });
      expect(route.request().postDataJSON()).toEqual({ token: "fixture-credential-only" });
      writes++;
      return route.fulfill({ json: { data: { id: "connection", provider: "github", accountLogin: "fixture-owner", revokedAt: null } } });
    });
    await page.goto(`${prefix}/dashboard/settings`);
    const region = page.getByRole("region", { name: providers.connectionsTitle });
    const input = region.locator("#github-token");
    await input.fill("fixture-credential-only");
    await input.locator("..").getByRole("button", { name: providers.connect }).click();
    await expect(region.getByText("fixture-owner")).toBeVisible();
    await region.getByRole("button", { name: providers.disconnect }).click();
    await expect(input).toHaveValue("");
    expect(writes).toBe(1);
  });

  test(`ordinary readers do not request creator provider connections (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
    let requests = 0;
    page.on("request", (request) => { if (request.url().endsWith("/api/marketplace/creator/provider-connections")) requests++; });
    await page.goto(`${prefix}/dashboard/settings`);
    await expect(page.getByRole("heading", { level: 1, name: copy[locale].profile })).toBeVisible();
    await expect(page.getByRole("region", { name: providers.connectionsTitle })).toHaveCount(0);
    expect(requests).toBe(0);
  });
}
