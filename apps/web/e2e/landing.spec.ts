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

  test("the hero is a datasheet: the example listing is labelled and states what it declares", async ({ page }) => {
    await page.goto("/");
    const sheet = page.getByRole("article").filter({ has: page.locator("#sheet-title") });
    await expect(sheet.getByText("Example listing")).toBeVisible();
    await expect(sheet.getByText("Example only, not a real listing")).toBeVisible();

    const ratings = sheet.getByRole("table", { name: "Absolute maximum ratings" });
    await expect(ratings.getByRole("row", { name: /Reads.*the diff under review.*declared/ })).toBeVisible();
    // An undeclared permission is marked, not omitted.
    await expect(ratings.getByRole("row", { name: /Writes.*not declared/ })).toBeVisible();
    await expect(sheet.getByRole("img", { name: /Pin diagram/ })).toBeVisible();
    await expect(sheet.getByText("termspace add staff-engineer-review@0123abc")).toBeVisible();
  });

  test("search is above the fold on a phone", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "Phone layout only.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const box = await page.getByLabel("Search community resources by outcome").boundingBox();
    expect(box!.y + box!.height).toBeLessThan(844);
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

  test("the hero runs no animations, with or without reduced motion", async ({ page }) => {
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

  for (const width of [320, 375]) test(`never scrolls sideways at ${width}px`, async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "Phone layout only.");
    await page.setViewportSize({ width, height: 812 });

    for (const path of ["/", "/fa"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${path} scroll width`).toBeLessThanOrEqual(width);
    }
  });
});
