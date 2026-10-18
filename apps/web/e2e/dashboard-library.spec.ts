import { expect, test, type Page } from "@playwright/test";
import { copy } from "../lib/i18n";
import { libraryCopy } from "../features/library/library-copy";

const entry = {
  acquisitionId: "order-1", acquiredAt: "2026-09-18T10:00:00Z",
  product: { id: "p1", slug: "conversion-copywriter", name: "Acquired copywriter", type: "Skill", typeKey: "skill", outcome: "An older release kept in your library", creator: { name: "Creator", handle: "creator" } },
  release: { id: "release-1", version: "1.0.0", sourceStatus: "stale" }, installationAvailable: true,
};
async function libraryFixture(page: Page) {
  await page.route("**/api/marketplace/library?*", (route) => {
    const page = Number(new URL(route.request().url()).searchParams.get("page"));
    expect(new URL(route.request().url()).searchParams.get("limit")).toBe("24");
    const data = page > 2 ? [] : page === 2 ? [{ ...entry, acquisitionId: "page-2", product: { ...entry.product, name: "Second page skill" } }]
      : [entry, { ...entry, acquisitionId: "restricted", product: { ...entry.product, name: "Restricted skill" }, installationAvailable: false }, { ...entry, acquisitionId: "legacy", product: { ...entry.product, name: "Legacy skill" }, release: null, installationAvailable: false }];
    return route.fulfill({ json: { data, meta: { page, limit: 24, total: 25, totalPages: 2 } } });
  });
}
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const text = libraryCopy[locale];
  test(`dashboard navigation and URL pagination reach the acquired library (${locale})`, async ({ page }, testInfo) => {
    await libraryFixture(page);
    await page.goto(`${prefix}/dashboard`);
    await page.getByRole("link", { name: text.quickAction }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/dashboard/library$`));
    await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
    const nav = page.getByRole("navigation", { name: testInfo.project.name.startsWith("mobile") ? copy[locale].dashboardHome.tabsLabel : copy[locale].dashboard });
    await expect(nav.getByRole("link", { name: text.label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(text.unavailable)).toHaveCount(2);
    await expect(page.getByText(text.legacy, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: text.install })).toHaveCount(1);
    const pages = page.getByRole("navigation", { name: text.pages });
    await pages.getByRole("button", { name: text.next }).click();
    await expect(page).toHaveURL(/library\?page=2$/);
    await expect(page.getByRole("heading", { name: "Second page skill" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acquired copywriter" })).toHaveCount(0);
    await page.goBack(); await expect(page.getByRole("heading", { name: "Acquired copywriter" })).toBeVisible();
    await page.goForward(); await page.reload();
    await expect(page.getByRole("heading", { name: "Second page skill" })).toBeVisible();
    await page.goto(`${prefix}/dashboard/library?page=99`);
    await expect(page).toHaveURL(/library\?page=2$/);
    await expect(page.getByRole("heading", { name: "Second page skill" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`library installation remains pinned to the acquired release (${locale})`, async ({ page }) => {
    await libraryFixture(page);
    await page.route("**/api/marketplace/products/conversion-copywriter/reviews/mine", (route) => route.fulfill({ json: { data: { eligibility: "eligible", review: null } } }));
    let acquisitions = 0;
    page.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/acquire")) acquisitions++; });
    await page.route("**/api/marketplace/products/conversion-copywriter/installation", (route) => route.fulfill({ json: { data: {
      acquisition: { id: "order-1", status: "completed", acquiredAt: entry.acquiredAt }, product: { slug: entry.product.slug, name: entry.product.name },
      release: {
        id: "release-1", version: "1.0.0", source: { kind: "github_repository", url: "https://github.com/example/tool", ref: "a".repeat(40), path: null, integrityDigest: null, artifactSizeBytes: null, status: "stale", checkedAt: entry.acquiredAt },
        installation: { method: "manual", url: `https://github.com/example/tool/archive/${"a".repeat(40)}.tar.gz`, instructions: ["Install the acquired version"] },
        requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [] }, license: "MIT", documentationUrl: null, supportUrl: null,
      },
    } } }));
    await page.goto(`${prefix}/dashboard/library`);
    await page.getByRole("link", { name: text.install }).click();
    await page.getByRole("button", { name: text.install, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("v1.0.0", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Install the acquired version", { exact: true })).toBeVisible();
    expect(acquisitions).toBe(0);
  });

  test(`long library names and versions wrap at 320px (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const name = "Acquired resource " + "x".repeat(80);
    await page.route("**/api/marketplace/library?*", (route) => route.fulfill({ json: {
      data: [{ ...entry, product: { ...entry.product, name }, release: { ...entry.release, version: "1.0.0-alpha." + "7".repeat(80) } }],
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    } }));
    await page.goto(`${prefix}/dashboard/library`);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });

  test(`library error retries and empty state stays usable for readers (${locale})`, async ({ page }) => {
    await page.route("**/api/readers/session", (route) => route.fulfill({ json: { data: { authenticated: true, user: { id: "reader", email: "reader@e2e.test", emailVerified: true, marketplaceRoles: [] } } } }));
    let failed = true;
    await page.route("**/api/marketplace/library?*", (route) => failed ? route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "Synthetic outage" } } })
      : route.fulfill({ json: { data: [], meta: { page: 1, limit: 24, total: 0, totalPages: 0 } } }));
    await page.goto(`${prefix}/dashboard/library`);
    const section = page.getByRole("region", { name: text.title });
    await expect(section.getByRole("alert")).toHaveText(text.error);
    await expect(section.getByText(text.empty)).toHaveCount(0);
    failed = false; await section.getByRole("button", { name: text.retry }).click();
    await expect(section.getByText(text.empty)).toBeVisible();
    await expect(section.getByRole("link", { name: text.browse })).toHaveAttribute("href", `${prefix}/explore`);
  });

  test(`/account keeps its account and paginated library (${locale})`, async ({ page }) => {
    await libraryFixture(page);
    await page.goto(`${prefix}/account?page=2`);
    await expect(page.getByRole("heading", { level: 1, name: copy[locale].account })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: text.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Second page skill" })).toBeVisible();
  });

  test(`signed-out library visitors return through account sign-in (${locale})`, async ({ page, context }) => {
    await context.clearCookies(); await page.goto(`${prefix}/dashboard/library`);
    await expect(page).toHaveURL(new RegExp(`${prefix}/account\\?next=`));
    expect(new URL(page.url()).searchParams.get("next")).toBe(`${prefix}/dashboard/library`);
  });
}
