import { chromium, expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { copy } from "../lib/i18n";
import { creatorWorkspace } from "../features/creator/workspace-copy";
import { draftValidationCopy } from "../features/creator/draft-validation";

const manifest = {
  manifestVersion: 1, type: "skill",
  listing: { slug: "review-tool", name: { en: "Review Tool" }, outcome: { en: "Reviews changes" }, description: { en: "Explains code changes carefully.", fa: "تغییرات کد را بررسی می‌کند." }, categorySlug: "development", tags: [], screenshots: [], communitySlugs: [] },
  release: { version: "1.0.0", source: { kind: "external_link", url: "https://example.com/tool", authorship: "own" }, releaseNotes: "Initial release", compatibility: [{ platform: "codex", models: [] }], installation: { method: "manual", instructions: ["Read the installation guide"] }, requirements: { environmentVariables: [] }, permissions: [], license: { identifier: "MIT" } },
  typeDetails: { format: "SKILL.md", entryPath: "SKILL.md", activation: "When reviewing code", bundledExecutables: false, inputs: [], outputs: [] },
};
async function fixtures(page: Page) {
  await page.route("**/api/marketplace/draft-options", route => route.fulfill({ json: { data: { categories: [{ slug: "development", name: "Development" }], platforms: [{ key: "codex", nameEn: "Codex" }], communities: [] } } }));
  await page.route("**/api/marketplace/creator/products/*/draft", route => route.fulfill({ json: { data: { id: "listing-3", version: 1, state: "draft", published: false, draft: { revision: 1, content: manifest } } } }));
}
test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]); await fixtures(page);
});

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : ""; const text = { ...copy[locale].creatorDraft, ...creatorWorkspace[locale].creatorDraft }; const validation = draftValidationCopy[locale];
  for (const theme of ["light", "dark"]) {
    test(`Next validates only this step; collapsed optional errors open and recover (${locale}/${theme})`, async ({ page }, info) => {
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${prefix}/dashboard/studio/listings/new`);
      const name = page.locator('[name="nameEn"]'); await expect(name).toBeVisible();
      await page.getByRole("button", { name: text.nextStep, exact: true }).click();
      await expect(name).toBeFocused(); await expect(name).toHaveAttribute("aria-invalid", "true");
      expect(await name.evaluate(element => { const id = element.getAttribute("aria-describedby")!.split(" ").at(-1)!; return document.getElementById(id)?.textContent; })).toBe(validation.required);
      await name.fill("Review Tool"); await page.locator('[name="categorySlug"]').selectOption("development");
      await page.locator('[name="outcomeEn"]').fill("Reviews code safely");
      await page.locator(`[name="description${locale === "fa" ? "Fa" : "En"}"]`).fill("Explains the changes carefully.");
      const details = page.locator('[data-draft-step="0"] details'); await details.locator("summary").click();
      const icon = page.locator('[name="icon"]'); await icon.fill("not-a-url"); await details.locator("summary").click();
      await page.getByRole("button", { name: text.nextStep, exact: true }).click();
      await expect(details).toHaveAttribute("open"); await expect(icon).toBeFocused(); await expect(icon).toHaveAttribute("aria-invalid", "true");
      await page.screenshot({ path: info.outputPath(`errors-${locale}-${theme}.png`), fullPage: true });
      await icon.fill(""); await expect(icon).not.toHaveAttribute("aria-invalid");
      await page.getByRole("button", { name: text.nextStep, exact: true }).click();
      await expect(page.locator('[name="projectUrl"]')).toBeVisible(); await expect(page.locator('[name="projectUrl"]')).not.toHaveAttribute("aria-invalid");
      await page.getByRole("button", { name: new RegExp(`^${text.stepBasics} —`) }).click();
      await expect(name).toHaveValue("Review Tool");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
    test(`restored review is automatic and completed badges keep labels (${locale}/${theme})`, async ({ page }, info) => {
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.goto(`${prefix}/dashboard/studio/listings/listing-3/edit`);
      const steps = page.locator("main nav ol button"); await expect(steps).toHaveCount(4);
      await expect(steps.nth(0)).toContainText(text.stepBasics); await expect(steps.nth(0).locator("svg")).toHaveCount(0);
      await page.getByRole("button", { name: new RegExp(`^${text.stepReview} —`) }).click();
      await expect(page.getByRole("region", { name: text.preview })).toContainText("https://example.com/tool");
      await expect(page.getByRole("button", { name: text.preview, exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: new RegExp(`^${text.stepReview} — ${validation.ready}`) })).toHaveAttribute("aria-current", "step");
      await page.getByRole("button", { name: `${validation.edit} ${text.stepBasics}`, exact: true }).click();
      await expect(page.locator('[name="nameEn"]')).toHaveValue("Review Tool");
      await page.screenshot({ path: info.outputPath(`about-${locale}-${theme}.png`), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
  test(`server field errors reopen the owning step and retain the draft (${locale})`, async ({ page }, info) => {
    await page.route("**/api/marketplace/creator/products/*/draft", route => route.request().method() === "PUT"
      ? route.fulfill({ status: 400, json: { error: { code: "VALIDATION_ERROR", message: "Review the icon", details: [{ path: "manifest.listing.icon", message: "Choose an approved image host." }] } } })
      : route.fallback());
    await page.goto(`${prefix}/dashboard/studio/listings/listing-3/edit`);
    await expect(page.locator('[name="nameEn"]')).toHaveValue("Review Tool");
    const details = page.locator('[data-draft-step="0"] details');
    if (await details.getAttribute("open") !== null) await details.locator("summary").click();
    await expect(details).not.toHaveAttribute("open");
    await page.getByRole("button", { name: new RegExp(`^${text.stepReview} —`) }).click();
    await page.getByRole("button", { name: text.save, exact: true }).click();
    const icon = page.locator('[name="icon"]');
    await expect(icon).toBeFocused(); await expect(icon).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-draft-step="0"] details')).toHaveAttribute("open");
    await expect(page.getByText("Choose an approved image host.", { exact: true })).toBeVisible();
    await expect(page.locator('[name="nameEn"]')).toHaveValue("Review Tool");
    await expect(page.getByRole("button", { name: new RegExp(`^${text.stepBasics} — ${validation.attention}`) })).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: text.nextStep, exact: true }).click();
    await expect(icon).toBeFocused();
    await page.screenshot({ path: info.outputPath(`server-error-${locale}.png`), fullPage: true });
  });
  test(`editor error focus clears chrome at native 200% zoom (${locale})`, async ({ baseURL }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "Native desktop zoom");
    const profile = info.outputPath("zoom-profile"); await mkdir(path.join(profile, "Default"), { recursive: true });
    await writeFile(path.join(profile, "Default", "Preferences"), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(profile, { channel: process.env.PW_CHANNEL ?? "chromium", headless: true, viewport: null, deviceScaleFactor: undefined, args: ["--window-size=1280,900"] });
    try {
      await context.addCookies([{ name: "e2e_persona", value: "creator", url: baseURL! }]); const page = context.pages()[0]; await fixtures(page);
      await page.goto(`${baseURL}${prefix}/dashboard/studio/listings/new`); await page.getByRole("button", { name: text.nextStep, exact: true }).click();
      const name = page.locator('[name="nameEn"]'); await expect(name).toBeFocused();
      await expect.poll(() => name.evaluate(element => { const r = element.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === element; })).toBe(true);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  });
}
