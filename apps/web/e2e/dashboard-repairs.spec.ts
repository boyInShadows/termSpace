import { expect, test, type Page } from "@playwright/test";
import { copy } from "../lib/i18n";
import { creatorWorkspace } from "../features/creator/workspace-copy";

const content = {
  manifestVersion: 1, type: "skill",
  listing: { slug: "review-skill", name: { en: "Review Skill" }, outcome: { en: "Review code safely" }, description: { en: "Reviews changes and explains findings." }, categorySlug: "development", tags: ["review"], screenshots: [], communitySlugs: [] },
  release: { version: "1.0.0", source: { kind: "github_repository", repositoryUrl: "https://github.com/example/reviewer", commitSha: "a".repeat(40) }, releaseNotes: "Initial release", compatibility: [{ platform: "codex", models: ["model-agnostic"] }], installation: { method: "git", instructions: ["Clone the repository"] }, requirements: { environmentVariables: [] }, permissions: [], license: { identifier: "MIT" } },
  typeDetails: { format: "markdown", entryPath: "SKILL.md", activation: "On code review" },
};

async function editorFixtures(page: Page) {
  await page.route("**/api/marketplace/item-types", (route) => route.fulfill({ json: { data: ["skill", "agent", "mcp_server", "integration", "rule", "prompt", "hook", "template", "workflow"].map((key) => ({ key, en: key, fa: key })) } }));
  await page.route("**/api/marketplace/draft-options", (route) => route.fulfill({ json: { data: { categories: [{ slug: "development", name: "Development" }], platforms: [{ key: "codex", name: "Codex" }], communities: [] } } }));
  await page.route("**/api/marketplace/creator/products/*/draft", (route) => route.fulfill({ json: { data: { id: "listing-3", version: 1, state: "draft", published: false, draft: { revision: 1, content } } } }));
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]);
});

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});

for (const locale of ["en", "fa"] as const) {
  for (const [width, height] of [[320, 720], [375, 812], [375, 350], [768, 1024], [812, 375], [1440, 1000]]) {
    test(`editor controls and search stay reachable at ${width}x${height} (${locale})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.startsWith("mobile"), "Viewport matrix runs once in desktop Chrome.");
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: width % 2 ? "dark" : "light", reducedMotion: "reduce" });
      await editorFixtures(page);
      const prefix = locale === "fa" ? "/fa" : "";
      await page.goto(`${prefix}/dashboard/studio/listings/0c0affee-abcd-4321-8765-112233445566/edit`);
      await expect(page.locator('[name="slug"]')).toHaveValue("review-skill");
      await page.keyboard.press("ControlOrMeta+k");
      await expect(page.locator("#dashboard-search")).toBeFocused();
      await expect(page.locator("#dashboard-search")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      for (const y of [700, 1500, 10000]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        for (const control of await page.locator("[data-draft-actions] button:not([disabled]), [data-draft-actions] a").all()) {
          expect(await control.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.top >= 0 && box.bottom <= innerHeight && element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
          })).toBe(true);
        }
      }
      await page.screenshot({ path: `../../maintenance/dashboard-repairs-20261018/editor-${locale}-${width}-${height}.png` });
    });
  }
}

test("internal navigation offers stay/discard and preserves a retained draft", async ({ page }) => {
  await editorFixtures(page);
  await page.goto("/dashboard/studio/listings/new");
  await page.locator('[name="slug"]').fill("retain-this-draft");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("navigation", { name: /Dashboard/ }).getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/listings\/new$/);
  await expect(page.locator('[name="slug"]')).toHaveValue("retain-this-draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("[data-draft-actions]").getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/dashboard\/studio$/);
});

test("global navigation also protects an unsaved dashboard draft", async ({ page }) => {
  await editorFixtures(page);
  await page.goto("/dashboard/studio/listings/new");
  await page.locator('[name="slug"]').fill("keep-this-global-navigation-draft");
  const header = page.locator("[data-site-header]");
  if ((page.viewportSize()?.width ?? 1280) < 768) await header.getByRole("button", { name: copy.en.open }).click();
  const navigation = header.getByRole("navigation", { name: (page.viewportSize()?.width ?? 1280) < 768 ? copy.en.mobile : copy.en.primary });
  page.once("dialog", (dialog) => dialog.dismiss());
  await navigation.getByRole("link", { name: copy.en.explore, exact: true }).click();
  await expect(page).toHaveURL(/\/listings\/new$/);
  await expect(page.locator('[name="slug"]')).toHaveValue("keep-this-global-navigation-draft");
  page.once("dialog", (dialog) => dialog.accept());
  await navigation.getByRole("link", { name: copy.en.explore, exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
});

test("Settings reaches the asynchronously loaded creator profile form", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.getByRole("link", { name: copy.en.creatorHub.editTitle }).click();
  await expect(page).toHaveURL(/\/dashboard\/studio#creator-profile$/);
  await expect(page.getByRole("heading", { name: copy.en.creatorHub.editTitle })).toBeInViewport();
});

test("every listing type exposes its required detail fields", async ({ page }) => {
  await editorFixtures(page);
  await page.goto("/dashboard/studio/listings/listing-3/edit");
  const types = page.locator('[name="itemType"]');
  await expect(types).toHaveValue("skill");
  for (const type of ["skill", "agent", "mcp_server", "integration", "rule", "prompt", "hook", "template", "workflow"]) {
    await page.getByRole("button", { name: /^Basics —/ }).click();
    await types.selectOption(type);
    await page.getByRole("button", { name: /^Type details —/ }).click();
    const section = page.locator("section").filter({ has: page.getByRole("heading", { name: copy.en.creatorDraft.typeDetailsTitle, exact: true }) });
    expect(await section.locator("input:required, textarea:required, select:required").count()).toBeGreaterThan(0);
  }
});

test("long names and large counts fit a narrow overview in both locales", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/marketplace/creator/dashboard?*", async (route) => {
    const result = await (await route.fetch()).json();
    result.data.summary.totalAcquisitions = 1234567890;
    result.data.summary.acquisitionsLast7Days = 1234567890;
    result.data.listings[0].name = "A very long listing name with a distinct ending Alpha";
    result.data.listings[1].name = "A very long listing name with a distinct ending Beta";
    await route.fulfill({ json: result });
  });
  for (const prefix of ["", "/fa"]) {
    await page.goto(`${prefix}/dashboard`);
    await expect(page.getByRole("table").getByText(/ending Alpha/)).toBeVisible();
    await expect(page.getByRole("table").getByText(/ending Beta/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    const values = await page.locator("main dl").first().locator("dd").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
    expect(values[0]).toBe(values[1]);
    expect(values[2]).toBe(values[3]);
  }
});

test("structured declarations preview and save as the existing manifest", async ({ page }) => {
  await editorFixtures(page);
  await page.goto("/dashboard/studio/listings/listing-3/edit");
  await expect(page.locator('[name="slug"]')).toHaveValue("review-skill");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
  await page.getByRole("button", { name: /^Access & license —/ }).click();
  await page.getByRole("button", { name: "Add: Environment variables" }).click();
  const group = page.getByRole("group", { name: "Environment variables" });
  await group.getByLabel("Environment variable name").fill("TOOL_TOKEN");
  await group.getByLabel("Purpose").fill("Read | write, carefully");
  await group.getByLabel("Required", { exact: true }).check();
  await group.getByLabel("Sensitive", { exact: true }).check();
  await page.getByRole("button", { name: creatorWorkspace.en.creatorDraft.saveLater, exact: true }).click();
  await page.getByRole("button", { name: /^Review —/ }).click();
  await page.getByRole("button", { name: "Preview listing declarations" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByRole("region", { name: "Preview listing declarations" })).toContainText("Read | write, carefully");
  const saved = page.waitForRequest((request) => request.method() === "PUT" && request.url().endsWith("/listing-3/draft"));
  await page.locator("[data-draft-actions]").getByRole("button", { name: "Save draft", exact: true }).click();
  expect((await saved).postDataJSON()).toMatchObject({ expectedVersion: 1, manifest: { release: { requirements: { environmentVariables: [{ name: "TOOL_TOKEN", purpose: "Read | write, carefully", required: true, sensitive: true }] }, compatibility: [{ platform: "codex", models: ["model-agnostic"] }] } } });
  await expect(page.getByText(copy.en.creatorDraft.saved).first()).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith("termspace:draft:") && key.endsWith(":listing-3")))).toBe(false);
});

for (const locale of ["en", "fa"] as const) {
  test(`unfinished steps resume with accurate progress and keyboard navigation (${locale})`, async ({ page }) => {
    await editorFixtures(page);
    const text = creatorWorkspace[locale].creatorDraft;
    const prefix = locale === "fa" ? "/fa" : "";
    const editor = `${prefix}/dashboard/studio/listings/new`;
    await page.goto(editor);
    await page.locator('[name="slug"]').fill("resume-later");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    const steps = page.getByRole("navigation", { name: text.sections });
    await steps.getByRole("button").nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#draft-step-heading")).toBeFocused();
    await expect(page.locator('[name="slug"]')).toBeHidden();
    await page.locator('[name="releaseVersion"]').fill("1.2.3");
    await page.getByRole("button", { name: text.saveLater, exact: true }).click();
    await expect(page.getByText(text.localSaved)).toBeVisible();
    await page.locator("[data-draft-actions]").getByRole("link").click();
    await expect(page).toHaveURL(/\/studio$/);
    await page.goto(editor);
    await expect(page.getByText(text.localRestored)).toBeVisible();
    await expect(page.locator('[name="releaseVersion"]')).toHaveValue("1.2.3");
    await steps.getByRole("button").first().click();
    await expect(page.locator('[name="slug"]')).toHaveValue("resume-later");
    await steps.getByRole("button").last().click();
    await page.getByRole("button", { name: copy[locale].creatorDraft.save, exact: true }).click();
    await expect(page.locator('[name="nameEn"]')).toBeFocused();
    await expect(page.locator('[name="nameEn"]')).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
}

test("submission recovers source blockers and stale versions without publishing", async ({ page }) => {
  let attempt = 0;
  let version = 1;
  let submitted = false;
  await page.route("**/api/marketplace/creator/dashboard?*", async (route) => {
    const response = await route.fetch();
    const result = await response.json();
    const item = result.data.listings.find((listing: { id: string }) => listing.id === "listing-3");
    item.lifecycleVersion = version;
    if (submitted) item.state = "submitted";
    await route.fulfill({ json: result });
  });
  await page.route("**/api/marketplace/creator/products/listing-3/lifecycle", async (route) => {
    attempt += 1;
    expect(route.request().postDataJSON()).toEqual({ action: "SUBMIT", expectedVersion: version });
    if (attempt === 1) return route.fulfill({ status: 409, json: { error: { code: "SOURCE_VERIFICATION_REQUIRED", message: "Source required" } } });
    if (attempt === 2) { version = 2; return route.fulfill({ status: 409, json: { error: { code: "LISTING_VERSION_CONFLICT", message: "Stale" } } }); }
    submitted = true;
    return route.fulfill({ json: { data: { state: "submitted", version: 3, published: false } } });
  });
  await page.goto("/dashboard/studio");
  const listing = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Release Notes Writer" }) });
  await listing.getByRole("button", { name: "Review submission" }).click();
  await listing.getByRole("button", { name: "Submit for review" }).click();
  await expect(listing.getByRole("alert")).toContainText(creatorWorkspace.en.creatorHub.submissionSourceRequired);
  await expect(listing.getByRole("alert").getByRole("link", { name: "Manage releases" })).toBeVisible();
  await listing.getByRole("button", { name: "Submit for review" }).click();
  await expect(listing.getByRole("alert")).toContainText(copy.en.creatorDraft.versionConflict);
  await listing.getByRole("alert").getByRole("button", { name: "Try again" }).click();
  await expect(listing.getByText(copy.en.creatorHub.dashboardLoading)).toHaveCount(0);
  await listing.getByRole("button", { name: "Submit for review" }).click();
  await expect(listing.getByRole("status")).toHaveText("Submitted");
  await expect(listing.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
  expect(attempt).toBe(3);
});
