import { expect, test, type Page } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

const INSTALLED = "✓ installed · pinned to v2.4.0";
/** The sequence starts 600ms after load and holds its last frame at 6.4s. */
const SEQUENCE_DONE_MS = 10_000;

/** The sequence only runs while half the scene is on screen; on a phone it sits below the copy. */
async function showManifest(page: Page) {
  await page.locator(".ts-seq").evaluate((node) => node.scrollIntoView({ block: "center" }));
}

/** Characters of the search command typed so far, read from the card. */
function typedSearch(page: Page) {
  return page.locator(".ts-typed").first().evaluate((node) =>
    getComputedStyle(node.parentElement!).getPropertyValue("--typed").trim(),
  );
}

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

  test("the manifest plays once, lands every chip, and offers Replay", async ({ page }, testInfo) => {
    await page.goto("/");
    await showManifest(page);

    const replay = page.getByRole("button", { name: "Replay" });
    await expect(replay).toBeVisible({ timeout: SEQUENCE_DONE_MS });
    await expect(page.getByText(INSTALLED)).toHaveAttribute("data-on", "true");

    if (!isMobile(testInfo.project.name)) {
      // Matched by their captions: the labels also appear in the manifest.
      for (const caption of ["safety reviewed", "permission scope", "12 versions"]) {
        const chip = page.locator(".ts-chip", { hasText: caption });
        await expect(chip).toHaveAttribute("data-on", "true");
        await expect(chip).toHaveCSS("opacity", "1");
      }
    }

    await replay.click();
    await expect(replay).toBeHidden();
    await expect(page.getByText(INSTALLED)).toHaveAttribute("data-on", "false");
    await expect(page.getByRole("button", { name: "Replay" })).toBeVisible({ timeout: SEQUENCE_DONE_MS });
  });

  test("the pause button holds the manifest mid-sequence", async ({ page }) => {
    await page.goto("/");
    await showManifest(page);
    const pause = page.getByRole("button", { name: "Pause demo" });
    await expect.poll(() => typedSearch(page)).not.toBe("0");

    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    const held = await typedSearch(page);
    await page.waitForTimeout(1_000);
    expect(await typedSearch(page)).toBe(held);

    await pause.click();
    await expect.poll(() => typedSearch(page)).not.toBe(held);
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

  test("holds the manifest while it is scrolled away", async ({ page }) => {
    await page.goto("/");
    await showManifest(page);
    await expect.poll(() => typedSearch(page)).not.toBe("0");

    await page.getByRole("heading", { name: "Featured building blocks" }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    const held = await typedSearch(page);
    await page.waitForTimeout(1_000);
    expect(await typedSearch(page)).toBe(held);
  });

  test("runs no animations under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The finished manifest frame at once, and nothing to pause or replay.
    await expect(page.getByText(INSTALLED)).toHaveCSS("opacity", "1");
    await expect(page.locator(".ts-typed").last()).toHaveCSS("clip-path", "none");
    await expect(page.getByRole("button", { name: /Pause demo|Replay/ })).toHaveCount(0);

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
