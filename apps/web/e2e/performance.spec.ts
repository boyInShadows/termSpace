import { expect, test } from "@playwright/test";

test.describe("performance wiring", () => {
  test("preloads only Geist for the English first paint", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const preloads = [...html.matchAll(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g)].map((match) => match[0]);
    expect(preloads).toHaveLength(1);
    expect(preloads[0]).toContain("geist-latin");
    expect(preloads[0]).not.toContain("newsreader");
    expect(html).not.toContain("estedad");
  });

  test("preloads Estedad on Persian pages", async ({ request }) => {
    const html = await (await request.get("/fa")).text();
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+href="\/fonts\/estedad-arabic-wght-v5\.3\.0\.woff2"/);
  });

  test("the hero heading stays static and draws no canvas on any device", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("[data-plasma-tier]")).toHaveCount(0);
    // The featured shelf now lives inside the hero and has its own status animation.
    const running = await page.getByRole("heading", { level: 1 }).evaluate((node) =>
      node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    );
    expect(running).toBe(0);
  });
});

test.describe("static sections", () => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) test(`content is visible before scrolling (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const closingSection = page.locator("main > section").last();
    await expect(closingSection).toBeVisible();
    const measure = () => closingSection.evaluate((node) => ({
      opacity: getComputedStyle(node).opacity,
      animations: node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    }));
    expect(await measure()).toEqual({ opacity: "1", animations: 0 });
    await closingSection.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    expect(await measure()).toEqual({ opacity: "1", animations: 0 });
  });
});
