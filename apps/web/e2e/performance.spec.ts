import { expect, test } from "@playwright/test";
import { copy } from "../lib/i18n";

test.describe("performance wiring", () => {
  for (const path of ["/", "/dashboard", "/products/conversion-copywriter", "/fa", "/fa/dashboard", "/fa/products/conversion-copywriter"]) {
    test(`${path} excludes draft editor labels from its shared HTML`, async ({ request }) => {
      const html = await (await request.get(path, { headers: { Cookie: "e2e_persona=creator" } })).text();
      expect(html.includes("createTitle")).toBe(false);
    });
  }

  for (const path of ["/dashboard/studio/listings/new", "/fa/dashboard/studio/listings/new"]) {
    test(`${path} receives the draft editor labels`, async ({ request, page, context, baseURL }) => {
      const html = await (await request.get(path, { headers: { Cookie: "e2e_persona=creator" } })).text();
      expect(html.includes("createTitle")).toBe(true);
      await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
      await page.route("**/api/marketplace/draft-options", (route) => route.fulfill({ json: { data: { categories: [], communities: [], platforms: [] } } }));
      await page.goto(path);
      const messages = copy[path.startsWith("/fa") ? "fa" : "en"].creatorDraft;
      await expect(page.getByRole("textbox", { name: messages.slug, exact: true })).toBeVisible();
    });
  }

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

test.describe("scroll reveals", () => {
  test("are complete once a section has scrolled fully into view", async ({ page }) => {
    await page.goto("/");
    const reveal = page.getByRole("region", { name: "Featured building blocks" }).locator(".ts-reveal").last();
    await reveal.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
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
