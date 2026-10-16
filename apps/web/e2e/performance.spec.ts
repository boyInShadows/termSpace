import { expect, test } from "@playwright/test";

test.describe("performance wiring", () => {
  test("preloads exactly the two fonts the English first paint needs", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const preloads = [...html.matchAll(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g)].map((match) => match[0]);
    expect(preloads).toHaveLength(2);
    expect(html).not.toContain("estedad");
  });

  test("preloads Estedad on Persian pages", async ({ request }) => {
    const html = await (await request.get("/fa")).text();
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+href="\/fonts\/estedad-arabic-wght-v5\.3\.0\.woff2"/);
  });

  test("the hero draws no canvas and starts no animation on any device", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("[data-plasma-tier]")).toHaveCount(0);
    const running = await page.locator("main section").first().evaluate((node) =>
      node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    );
    expect(running).toBe(0);
  });
});

test.describe("scroll reveals", () => {
  test("are complete once a section has scrolled fully into view", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: "Featured building blocks" });
    await heading.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    const reveal = page.locator(".ts-reveal", { has: heading });
    await expect.poll(() => reveal.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  });

  test("do nothing under reduced motion: content is there before any scroll", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const opacities = await page.locator(".ts-reveal").evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).opacity));
    expect(opacities.length).toBeGreaterThan(0);
    expect(opacities.every((opacity) => opacity === "1")).toBe(true);
  });
});
