import { expect, test, type Page } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

function featuredSection(page: Page) {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: "Featured building blocks" }),
  });
}

test.describe("landing", () => {
  test("renders the hero, search and featured listings from the fixture", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Search community resources by outcome")).toBeVisible();
    await expect(featuredSection(page).locator("article").first()).toBeVisible();
    // The fixture render is the healthy path, not the degraded fallback.
    await expect(featuredSection(page).getByRole("status")).toHaveCount(0);
  });

  test("shows the three hero chips on wide screens", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "The chips are hidden below md.");
    await page.goto("/");

    // Matched by their captions: the labels also appear in the manifest.
    for (const caption of ["safety reviewed", "permission scope", "12 versions"]) {
      await expect(page.getByText(caption, { exact: true })).toBeVisible();
    }
  });

  test("how-it-works panel follows the step in view, both directions", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "The pinned panel only exists at lg and up.");
    await page.goto("/");

    const panel = page.getByTestId("pinned-panel");
    const steps = [
      ["Search by outcome", "discover"],
      ["Read what it touches", "inspect"],
      ["Put it to work", "install"],
    ] as const;

    const visit = async (title: string, id: string) => {
      await page.getByRole("heading", { name: title }).evaluate((node) => node.scrollIntoView({ block: "center" }));
      await expect(panel).toContainText(id);
    };

    for (const [title, id] of steps) await visit(title, id);
    for (const [title, id] of [...steps].reverse()) await visit(title, id);
  });

  test("runs no animations under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const hero = page.locator("section").first();
    await expect
      .poll(() =>
        hero.evaluate((node) =>
          node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
        ),
      )
      .toBe(0);
  });

  test("never scrolls sideways at 375px", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "Phone layout only.");
    await page.setViewportSize({ width: 375, height: 812 });

    for (const path of ["/", "/fa"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${path} scroll width`).toBeLessThanOrEqual(375);
    }
  });
});
