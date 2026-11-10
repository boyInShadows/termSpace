import { expect, test, type Page } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

function featuredSection(page: Page) {
  return page.getByRole("region", { name: "Featured building blocks" });
}

test.describe("landing", () => {
  for (const locale of ["en", "fa"]) for (const theme of ["light", "dark"]) {
    test(`search uses one pill-shaped focus indicator (${locale}/${theme})`, async ({ page, context }) => {
      await context.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
      await page.goto(locale === "fa" ? "/fa" : "/");
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
      const search = page.getByRole("combobox");
      const wrapper = search.locator("..");
      const idleBorder = await wrapper.evaluate((node) => getComputedStyle(node).borderColor);
      await search.click();
      await expect(search).toHaveCSS("outline-style", "none");
      await expect(wrapper).toHaveCSS("box-shadow", "none");
      await expect.poll(() => wrapper.evaluate((node) => getComputedStyle(node).borderColor)).not.toBe(idleBorder);
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(search).toBeFocused();
      await expect(search).toHaveCSS("outline-style", "none");
      await expect(wrapper).toHaveCSS("box-shadow", "none");
      await search.fill("agent");
      await expect(search).toHaveValue("agent");
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAttribute("type", "submit");
      await expect(page.locator(":focus")).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${locale === "fa" ? "/fa" : ""}/explore\\?q=agent$`));
    });
  }

  test("featured listings share the first screen with the search", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "Phones stack the shelf below the fold by design.");
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto("/");
    const cards = featuredSection(page).locator("article");
    await expect(cards).toHaveCount(3);
    const box = await cards.first().boundingBox();
    expect(box!.y + box!.height).toBeLessThan(800);
  });

  test("renders the hero, search and featured listings from the fixture", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Search community resources by outcome")).toBeVisible();
    await expect(featuredSection(page).locator("article").first()).toBeVisible();
    // The fixture render is the healthy path, not the degraded fallback.
    await expect(featuredSection(page).getByRole("status")).toHaveCount(0);
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
