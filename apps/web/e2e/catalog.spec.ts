import { expect, test } from "@playwright/test";

const isMobile = (projectName: string) => projectName.startsWith("mobile");

test.describe("product detail", () => {
  test("renders the listing header, trust chips and manifest from the mock", async ({ page }) => {
    const response = await page.goto("/products/conversion-copywriter");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: "Conversion Copywriter" })).toBeVisible();
    // A streamed page is revealed inside a view transition, and until it ends
    // React keeps a hidden copy of the content beside the visible one, which a
    // strict text locator counts twice. Wait for the copy to go.
    await expect(page.locator('[id^="S:"][hidden]')).toHaveCount(0);
    for (const claim of ["Verified", "Reads the current selection · no network access", "MIT"]) {
      await expect(page.locator("header").getByText(claim, { exact: true })).toBeVisible();
    }
    const manifest = page.locator("#manifest dl");
    for (const label of ["type", "platforms", "permissions", "requirements", "license", "reviewed", "version"]) {
      await expect(manifest.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page).toHaveTitle("Conversion Copywriter — Skill for Claude · termspace");
  });

  for (const width of [375, 735, 768, 1440]) {
    test(`the acquire panel is within two screens of the top at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/products/conversion-copywriter");
      const add = page.getByRole("button", { name: "Add to library" });
      await expect(add).toBeVisible();
      const top = await add.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
      expect(top).toBeLessThan(1800);
    });
  }

  test("shows where the release comes from and how to fetch it, without signing in", async ({ page }) => {
    await page.goto("/products/conversion-copywriter");

    const provenance = page.locator("#provenance");
    await expect(provenance.getByRole("heading", { name: "Source & provenance" })).toBeVisible();
    await expect(provenance.getByText("GitHub repository")).toBeVisible();
    await expect(provenance.getByText("Reads the diff it reviews.")).toBeVisible();
    await expect(provenance.getByText("git clone https://github.com/termspace-fixtures/conversion-copywriter.git")).toBeVisible();
    await expect(provenance.getByRole("button", { name: "Copy" })).toBeVisible();
    await expect(provenance.getByText("not a guarantee of safety", { exact: false })).toBeVisible();
  });

  test("invites a signed-out visitor to sign in to review, and keeps them on the page afterwards", async ({ page }) => {
    await page.goto("/products/conversion-copywriter");

    const reviews = page.locator("#reviews");
    await expect(reviews.getByRole("heading", { name: "Your review" })).toBeVisible();
    await expect(reviews.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account?next=%2Fproducts%2Fconversion-copywriter");
    await expect(reviews.getByRole("button", { name: "Post review" })).toHaveCount(0);
  });

  test("the version picker shows what changed in the chosen release", async ({ page }) => {
    await page.goto("/products/conversion-copywriter");
    await expect(page.getByText("Adds reviewer checklists for migrations.")).toBeVisible();

    await page.getByLabel("Version").selectOption({ label: "v2.3.0" });
    await expect(page.getByText("Tighter summaries; drops the network permission.")).toBeVisible();
  });

  test("an unknown listing returns 404 and is marked noindex", async ({ page }) => {
    const response = await page.goto("/products/no-such-listing");
    expect(response?.status()).toBe(404);
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
    // The morph waits at most 1.5s for the detail page; under a fully
    // parallel local run a cold render can take longer, so warm it first.
    await page.request.get("/products/conversion-copywriter");
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
  test("declared access survives reload and can be cleared on desktop and mobile", async ({ page }, testInfo) => {
    await page.goto("/explore");
    if (isMobile(testInfo.project.name)) await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("combobox", { name: "Declared access" }).selectOption("telemetry");
    await expect(page).toHaveURL(/permission=telemetry/);
    if (isMobile(testInfo.project.name)) await page.getByRole("button", { name: /^Show \d+ results/ }).click();
    await expect(page.getByText("No resources found")).toBeVisible();
    await page.reload();
    await expect(page.getByText("No resources found")).toBeVisible();
    await expect(page.getByText("Send telemetry", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Clear all", exact: true }).first().click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.locator("article")).toHaveCount(12);
  });

  test("every card states its review state, licence and permissions, and the outline skips no level", async ({ page }) => {
    await page.goto("/explore");
    const cards = page.locator("article");
    await expect(cards).toHaveCount(12);
    for (const card of await cards.all()) {
      await expect(card.getByText(/Safety reviewed|Not yet reviewed/)).toHaveCount(1);
      await expect(card.getByText(/Permissions not declared|·/).first()).toBeVisible();
    }
    await expect(cards.first().getByText("Safety reviewed")).toBeVisible();
    await expect(cards.first().getByText("MIT")).toBeVisible();
    await expect(cards.first().getByText("Reads the current selection · no network access")).toBeVisible();

    const levels = await page.locator("h1, h2, h3, h4").evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])));
    for (let index = 1; index < levels.length; index++) expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  });

  test("the search field has an accessible name, not only a placeholder", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("textbox", { name: /Search resources/ })).toBeVisible();
    await page.goto("/fa/explore");
    await expect(page.getByRole("textbox", { name: /جست‌وجو/ })).toBeVisible();
  });

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
    await expect(page.locator('link[rel="next"],link[rel="prev"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Previous page" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Next page" })).toHaveAttribute("rel", "next");
    await expect(page.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/explore?page=2");

    await page.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/\/explore\?page=2$/);
    await expect(page.locator("article h3")).toHaveCount(3);
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
    await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Previous page" })).toHaveAttribute("rel", "prev");
    await expect(page.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/explore");

    await page.getByRole("link", { name: "Previous page" }).click();
    await expect(page.getByRole("link", { name: "Previous page" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(1);
    await expect(page.locator('link[rel="next"],link[rel="prev"]')).toHaveCount(0);
  });

  test("HTML-only crawlers receive real pagination links with locale and filters", async ({ request, page }) => {
    for (const path of ["/explore", "/fa/explore?permission=filesystem_read", "/explore?page=2"]) {
      const response = await request.get(path, { headers: { "User-Agent": "Twitterbot/1.0" } });
      expect(response.status()).toBe(200);
      const html = await response.text();
      const rel = path.includes("page=2") ? "prev" : "next";
      const links = await page.evaluate((html) => {
        const document = new DOMParser().parseFromString(html, "text/html");
        return Array.from(document.querySelectorAll('a[rel="next"],a[rel="prev"]')).map((node) => ({ rel: node.getAttribute("rel"), href: node.getAttribute("href") }));
      }, html);
      expect(links).toEqual([{ rel, href: path.startsWith("/fa") ? "/fa/explore?permission=filesystem_read&page=2" : rel === "prev" ? "/explore" : "/explore?page=2" }]);
    }
  });

  test("no results offers to clear the filters", async ({ page }) => {
    await page.goto("/explore?q=nothing-matches-this");
    await expect(page.getByText("No resources found")).toBeVisible();

    await page.getByRole("button", { name: "Clear all" }).last().click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.locator("section p[role=status]")).toHaveText("15 resources");
  });
});
