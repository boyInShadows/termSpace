import { expect, test } from "@playwright/test";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test.describe("not found and errors", () => {
  test("an unknown address is a real 404 with the branded page", async ({ page }) => {
    const response = await page.goto("/nope");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Nothing on this shelf." })).toBeVisible();
    await expect(page.getByLabel("Search community resources by outcome")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the catalogue" })).toBeVisible();
  });

  test("an unknown listing gets the listing not-found page", async ({ page }) => {
    await page.goto("/products/no-such-listing");
    await expect(page.getByRole("heading", { level: 1, name: "This listing isn’t here." })).toBeVisible();
  });

  test("a failing page shows the error boundary with a retry", async ({ page }) => {
    await page.goto("/products/fixture-error");
    await expect(page.getByRole("heading", { level: 1, name: "Something went wrong here." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

test.describe("search engines and sharing", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Server output; checked once.");
  });

  test("the sitemap lists every live listing", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const listings = [...xml.matchAll(/<loc>[^<]*\/products\/([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(listings).toHaveLength(15);
    expect(listings).toContain("conversion-copywriter");
    expect(xml).toContain("<loc>http://localhost:3000/explore</loc>");
  });

  test("robots.txt keeps private surfaces out and points at the sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Disallow: /fa/account");
    expect(robots).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  });

  test("a listing has a 1200×630 social card, large-image metadata and JSON-LD", async ({ page, request }) => {
    await page.goto("/products/conversion-copywriter");

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const image = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(image).toContain("/products/conversion-copywriter/opengraph-image");

    const card = await request.get(new URL(image!).pathname + new URL(image!).search);
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toBe("image/png");
    expect(pngSize(await card.body())).toEqual({ width: 1200, height: 630 });

    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(jsonLd).toMatchObject({
      "@type": "SoftwareApplication",
      name: "Conversion Copywriter",
      offers: { price: "0" },
      aggregateRating: { "@type": "AggregateRating" },
    });
  });

  test("the homepage has its own social card", async ({ request }) => {
    const card = await request.get("/opengraph-image");
    expect(card.status()).toBe(200);
    expect(pngSize(await card.body())).toEqual({ width: 1200, height: 630 });
  });
});
