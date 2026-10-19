import { expect, test, type Page } from "@playwright/test";
import { copy } from "../lib/i18n";
import { libraryCopy } from "../features/library/library-copy";

async function globalNavigation(page: Page, locale: "en" | "fa") {
  const header = page.locator("[data-site-header]");
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await header.getByRole("button", { name: copy[locale].open }).click();
    return header.getByRole("navigation", { name: copy[locale].mobile });
  }
  return header.getByRole("navigation", { name: copy[locale].primary });
}

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  test(`fast sessions hydrate the shared header without mismatches (${locale})`, async ({ page, context, baseURL }) => {
    test.setTimeout(60_000);
    await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
    await page.setViewportSize({ width: 768, height: 900 });
    await page.route("**/api/readers/session", (route) => route.fulfill({ json: { data: {
      authenticated: true,
      user: { email: "creator@e2e.test", emailVerified: true, marketplaceRoles: ["creator"] },
    } } }));
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
    for (let round = 0; round < 3; round++) {
      for (const route of ["/", "/dashboard", "/dashboard/settings", "/dashboard/library", "/dashboard/library/saved", "/explore"]) {
        await page.goto(`${prefix}${route}`, { waitUntil: "networkidle" });
        await expect(page.locator("[data-site-header]")).toHaveCount(1);
        await expect(page.getByRole("button", { name: copy[locale].account, exact: true })).toBeVisible();
        expect(errors).toEqual([]);
      }
    }
  });

  test(`one global header persists through home, dashboard and discovery (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
    await page.goto(prefix || "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const header = page.locator("[data-site-header]");
    const mountedHeader = await header.elementHandle();
    const initialNavigation = await globalNavigation(page, locale);
    const globalLinks = await initialNavigation.getByRole("link").evaluateAll((links) => links.filter((link) => !link.hasAttribute("lang")).map((link) => link.getAttribute("href")));
    await initialNavigation.getByRole("link", { name: copy[locale].shareWork }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/dashboard/studio$`));
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    expect(await mountedHeader!.evaluate((node) => node.isConnected && node === document.querySelector("[data-site-header]"))).toBe(true);
    await expect(page.getByRole("banner")).toHaveCount(1);
    expect(await (await globalNavigation(page, locale)).getByRole("link").evaluateAll((links) => links.filter((link) => !link.hasAttribute("lang")).map((link) => link.getAttribute("href")))).toEqual(globalLinks);
    if ((page.viewportSize()?.width ?? 1280) < 768) await header.getByRole("button", { name: copy[locale].close }).click();
    const dashboardNavigation = page.getByRole("navigation", { name: (page.viewportSize()?.width ?? 1280) < 1024 ? copy[locale].dashboardHome.tabsLabel : copy[locale].dashboard });
    await dashboardNavigation.getByRole("link", { name: libraryCopy[locale].label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/dashboard/library$`));
    await expect(page.locator("#dashboard-search")).toBeVisible();
    await (await globalNavigation(page, locale)).getByRole("link", { name: copy[locale].explore, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/explore$`));
    expect(await mountedHeader!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(header).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`the root skip link focuses content across sections (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
    for (const path of ["/", "/dashboard", "/explore", "/products/conversion-copywriter", "/account"]) {
      await page.goto(`${prefix}${path === "/" ? "" : path}`);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: locale === "fa" ? "رفتن به محتوا" : "Skip to content" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();
      await expect(page.getByRole("banner")).toHaveCount(1);
    }
  });

  for (const role of ["reader", "creator", "moderator", "administrator"]) {
    test(`dashboard inherits the global role-aware navigation (${locale}/${role})`, async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
      await page.route("**/api/readers/session", (route) => route.fulfill({ json: { data: {
        authenticated: true,
        user: { id: "reader-creator", email: "creator@e2e.test", emailVerified: true, marketplaceRoles: role === "reader" ? [] : [role] },
      } } }));
      await page.goto(`${prefix}/dashboard`);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      const navigation = await globalNavigation(page, locale);
      const moderation = navigation.getByRole("link", { name: copy[locale].moderationNav, exact: true });
      if (role === "moderator" || role === "administrator") {
        await expect(moderation).toBeVisible();
        await expect(moderation).toHaveAttribute("href", `${prefix}/moderation`);
      } else await expect(moderation).toHaveCount(0);
      await page.unrouteAll({ behavior: "wait" });
    });
  }
}

test("dashboard language navigation preserves the route and query", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/settings?panel=security");
  await page.locator('[data-site-header] a[lang="fa"]').first().click();
  await expect(page).toHaveURL(/\/fa\/dashboard\/settings\?panel=security$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("[data-site-header]")).toHaveCount(1);
});

test("the shared phone menu fits landscape and closes on route changes", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/dashboard");
  const header = page.locator("[data-site-header]");
  await header.getByRole("button", { name: copy.en.open }).click();
  const language = header.getByRole("navigation", { name: copy.en.mobile }).getByRole("link", { name: copy.en.language });
  await language.scrollIntoViewIfNeeded();
  expect(await language.evaluate((node) => { const box = node.getBoundingClientRect(); return box.bottom <= innerHeight && node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); })).toBe(true);
  await header.getByRole("link", { name: "termspace home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(header.getByRole("button", { name: copy.en.open })).toHaveAttribute("aria-expanded", "false");
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(header.getByRole("button", { name: copy.en.open })).toHaveAttribute("aria-expanded", "false");
});
