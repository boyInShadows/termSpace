import { expect, test } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

test.describe("product detail", () => {
  test("renders the listing header, trust chips and manifest from the mock", async ({ page }) => {
    await page.goto("/products/conversion-copywriter");

    await expect(page.getByRole("heading", { level: 1, name: "Conversion Copywriter" })).toBeVisible();
    for (const claim of ["Verified", "Reads the current selection · no network access", "MIT"]) {
      await expect(page.locator("header").getByText(claim, { exact: true })).toBeVisible();
    }
    const manifest = page.locator("#manifest dl");
    for (const label of ["type", "platforms", "permissions", "requirements", "license", "reviewed", "version"]) {
      await expect(manifest.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page).toHaveTitle("Conversion Copywriter — Skill for Claude · termspace");
  });

  test("the version picker shows what changed in the chosen release", async ({ page }) => {
    await page.goto("/products/conversion-copywriter");
    await expect(page.getByText("Adds reviewer checklists for migrations.")).toBeVisible();

    await page.getByLabel("Version").selectOption({ label: "v2.3.0" });
    await expect(page.getByText("Tighter summaries; drops the network permission.")).toBeVisible();
  });

  test("an unknown listing is marked noindex", async ({ page }) => {
    // loading.tsx streams the skeleton first, so the status is already 200
    // when the listing turns out not to exist; Next marks the page noindex,
    // which keeps it out of search indexes. A true 404 status would need an
    // existence check in proxy.ts before rendering (plan P5).
    await page.goto("/products/no-such-listing");
    await expect(page.locator("meta[name=robots][content*=noindex]").first()).toBeAttached();
  });

  test("clicking a featured card morphs its title into the detail header", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "Checked once, in desktop Chrome.");
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __groups: string[] }).__groups = seen;
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (update) => {
        const transition = start(update);
        void transition.ready.then(() => {
          for (const animation of document.getAnimations()) {
            const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement;
            if (pseudo?.startsWith("::view-transition-group(listing-")) seen.push(pseudo);
          }
        });
        return transition;
      };
    });
    await page.goto("/");
    const featured = page.locator("section", { has: page.getByRole("heading", { name: "Featured building blocks" }) });
    await featured.scrollIntoViewIfNeeded();
    await featured.locator("article h3 a").first().click();

    await expect(page.locator("h1[data-listing-header]")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __groups: string[] }).__groups))
      .toContain("::view-transition-group(listing-mock-product-0)");
  });
});

test.describe("explore", () => {
  test("a filter changes the URL and the results", async ({ page }) => {
    await page.goto("/explore");
    const count = page.locator("section p[role=status]");
    await expect(count).toHaveText("15 resources");

    await page.getByRole("tab", { name: "Agents" }).click();
    await expect(page).toHaveURL(/\/explore\?type=agent$/);
    await expect(count).toHaveText("3 resources");
    await expect(page.locator("article h3")).toHaveCount(3);

    // The URL is the state: reloading keeps the view.
    await page.reload();
    await expect(count).toHaveText("3 resources");
    await expect(page.getByRole("tab", { name: "Agents" })).toHaveAttribute("aria-selected", "true");
  });

  test("pages are real links, announced to crawlers", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator('head link[rel="next"]')).toHaveAttribute("href", "/explore?page=2");

    await page.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/\/explore\?page=2$/);
    await expect(page.locator("article h3")).toHaveCount(3);
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
    await expect(page.locator('head link[rel="prev"]')).toHaveAttribute("href", "/explore");
  });

  test("no results offers to clear the filters", async ({ page }) => {
    await page.goto("/explore?q=nothing-matches-this");
    await expect(page.getByText("No resources found")).toBeVisible();

    await page.getByRole("button", { name: "Clear all" }).last().click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.locator("section p[role=status]")).toHaveText("15 resources");
  });
});
