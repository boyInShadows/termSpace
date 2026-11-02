import { expect, test, type Page } from "@playwright/test";
import { onboardingCopy } from "../../features/account/onboarding-copy";

test.use({ channel: process.env.PW_CHANNEL ?? "chrome" });

async function accountFixture(page: Page, required = true) {
  await page.context().addCookies([{ name: "e2e_persona", value: "reader", domain: "127.0.0.1", path: "/" }]);
  let profile = { required, role: null as string | null, goal: null as string | null, tools: [] as string[], intent: null as string | null };
  await page.route("**/backend/api/readers/onboarding", async (route) => {
    if (route.request().method() === "PUT") profile = { ...route.request().postDataJSON(), required: false };
    await route.fulfill({ json: { data: profile } });
  });
  return () => profile;
}

for (const locale of ["en", "fa"] as const) {
  for (const intent of ["explore", "create"] as const) {
    test(`${locale} saves onboarding then opens ${intent}`, async ({ page }) => {
      const copy = onboardingCopy[locale];
      const read = await accountFixture(page);
      const prefix = locale === "fa" ? "/fa" : "";
      await page.goto(`${prefix}/onboarding`);
      await page.getByLabel(copy.roles.developer, { exact: true }).check();
      await page.getByRole("button", { name: copy.continue, exact: true }).click();
      await page.getByLabel(copy.goals.workflow, { exact: true }).check();
      await page.getByRole("button", { name: copy.continue, exact: true }).click();
      await page.getByLabel("Codex", { exact: true }).check();
      await page.getByLabel("Cursor", { exact: true }).check();
      await page.getByRole("button", { name: copy.continue, exact: true }).click();
      await page.getByLabel(copy.intents[intent], { exact: true }).check();
      await page.getByRole("button", { name: intent === "create" ? copy.studio : copy.explore, exact: true }).click();
      await expect(page).toHaveURL(`${prefix}${intent === "create" ? "/dashboard/studio" : "/explore"}`);
      expect(read()).toEqual({ required: false, role: "developer", goal: "workflow", tools: ["codex", "cursor"], intent });
      await page.goto(`${prefix}/onboarding`);
      await expect(page).toHaveURL(`${prefix}${intent === "create" ? "/dashboard/studio" : "/explore"}`);
      await page.goto(`${prefix}/dashboard/settings`);
      await expect(page.getByLabel(copy.roles.developer, { exact: true })).toBeChecked();
      await page.getByLabel(copy.roles.designer, { exact: true }).check();
      await page.getByRole("button", { name: copy.save, exact: true }).click();
      await expect(page.getByText(copy.saved, { exact: true })).toBeVisible();
      await expect(page).toHaveURL(`${prefix}/dashboard/settings`);
      await page.reload();
      await expect(page.getByLabel(copy.roles.designer, { exact: true })).toBeChecked();
    });
  }
}

test("profile questions keep keyboard focus above the phone tabs", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await accountFixture(page, false);
  await page.goto("/dashboard/settings");
  const form = page.getByRole("form", { name: onboardingCopy.en.profileTitle, exact: true });
  await form.getByRole("radio").first().waitFor();
  for (const control of await form.locator("input, button").all()) {
    await control.focus();
    const visible = await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      return centerY > 0 && centerY < innerHeight && document.elementFromPoint(centerX, centerY) === element;
    });
    expect(visible).toBe(true);
  }
});

test("a new password sign-in opens onboarding before its previous destination", async ({ page }) => {
  await accountFixture(page);
  await page.context().clearCookies();
  await page.route("**/backend/api/readers/login", async (route) => {
    await page.context().addCookies([{ name: "e2e_persona", value: "reader", domain: "127.0.0.1", path: "/" }]);
    await route.fulfill({ json: { data: { authenticated: true, user: { onboardingRequired: true } } } });
  });
  await page.goto("/account?next=%2Fdashboard%2Flibrary");
  await page.getByLabel("Email", { exact: true }).fill("new@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/onboarding");
  await expect(page.getByRole("heading", { name: onboardingCopy.en.title })).toBeVisible();
});

for (const locale of ["en", "fa"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`${locale} ${theme} onboarding is usable at phone, tablet and desktop widths`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await accountFixture(page);
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const prefix = locale === "fa" ? "/fa" : "";
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${prefix}/onboarding`);
        await expect(page.getByLabel(onboardingCopy[locale].roles.developer, { exact: true })).toBeVisible();
        expect(await page.locator("html").getAttribute("dir")).toBe(locale === "fa" ? "rtl" : "ltr");
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.keyboard.press("Tab");
        await expect(page.locator('a[href="#content"]')).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator("main#content")).toBeFocused();
        await page.screenshot({ path: testInfo.outputPath(`onboarding-${locale}-${theme}-${width}.png`), fullPage: true });
      }
      expect(errors).toEqual([]);
    });
  }
}
