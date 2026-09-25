import { expect, test } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

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

  test("phones get the CSS nebula and never a WebGL canvas", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "Phone tier only.");
    await page.goto("/");
    await expect(page.locator("[data-plasma-tier]")).toHaveAttribute("data-plasma-tier", "css");
    await page.waitForTimeout(3_000);
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("a capable desktop is offered the WebGL tier", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "Desktop tier only.");
    await page.goto("/");
    await expect(page.locator("[data-plasma-tier]")).toHaveAttribute("data-plasma-tier", "webgl");
  });

  test("reduced motion holds the nebula still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-plasma-tier]")).toHaveAttribute("data-plasma-tier", "static");
    await expect(page.locator(".ts-nebula-swirl")).toHaveCSS("animation-name", "none");
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
