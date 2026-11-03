import { expect, test } from "@playwright/test";

test("signup shows the inbox message, and the email link opens onboarding", async ({ page }) => {
  let authenticated = false;
  let verified = false;
  await page.route("**/backend/api/marketplace/favorites", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/backend/api/readers/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const session = () => ({ authenticated: true, user: { id: "reader-e2e", email: "signup@e2e.test", emailVerified: verified, marketplaceRoles: [], onboardingRequired: true } });
    // Registering starts no session; the reader follows the link from their inbox.
    if (path.endsWith("/register")) { await route.fulfill({ status: 202, json: { data: { accepted: true } } }); return; }
    if (path.endsWith("/login")) { authenticated = true; await route.fulfill({ json: { data: session() } }); return; }
    if (path.endsWith("/email-verification/confirm")) {
      expect(route.request().postDataJSON()).toEqual({ token: "test-verification.signature" });
      verified = true;
      authenticated = true;
      await route.fulfill({ json: { data: { verified: true, authenticated: true, user: { id: "reader-e2e", email: "signup@e2e.test", emailVerified: true, marketplaceRoles: [], onboardingRequired: true } } } });
      return;
    }
    if (path.endsWith("/onboarding")) {
      await route.fulfill({ json: { data: { required: true, role: null, goal: null, tools: [], intent: null } } });
      return;
    }
    await route.fulfill({ json: { data: authenticated ? session() : { authenticated: false } } });
  });
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await page.getByLabel("Email", { exact: true }).fill("signup@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirm password").fill("correct-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText("signup@e2e.test")).toBeVisible();
  await expect(page.getByText(/You can safely close this window/)).toBeVisible();
  // The form and its inputs are gone; the reader acts on the email instead.
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await page.goto("/account/verify-email#token=test-verification.signature");
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("password reset link opens the new-password form and lands in settings", async ({ page, context }) => {
  await page.route("**/backend/api/readers/password-reset/**", async (route) => {
    const confirm = route.request().url().endsWith("/confirm");
    if (confirm) expect(route.request().postDataJSON()).toEqual({ token: "test-reset.signature", newPassword: "replacement-password" });
    await route.fulfill({ json: { data: confirm ? { reset: true, authenticated: true, user: { id: "reader-e2e", email: "reader@e2e.test", emailVerified: true, marketplaceRoles: [], onboardingRequired: false } } : { accepted: true } } });
  });
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("reader@e2e.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText(/If an account exists for/)).toBeVisible();
  // The reset link signs this browser in; the emailed token opens the form.
  await context.addCookies([{ name: "e2e_persona", value: "creator", domain: "127.0.0.1", path: "/" }]);
  await page.goto("/account/reset-password#token=test-reset.signature");
  await page.getByLabel("New password", { exact: true }).fill("replacement-password");
  await page.getByLabel("Confirm password").fill("replacement-password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
});

test("an accepted session leaves the verification page for its account", async ({ page }) => {
  let authenticated = false;
  const session = { authenticated: true, user: { id: "local-reader", email: "local@e2e.test", emailVerified: true, marketplaceRoles: [], onboardingRequired: false } };
  await page.route("**/backend/api/marketplace/favorites", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/backend/api/readers/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/register")) { await route.fulfill({ status: 202, json: { data: { accepted: true } } }); return; }
    if (url.endsWith("/login")) authenticated = true;
    await route.fulfill({ json: { data: authenticated ? session : { authenticated: false } } });
  });
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await page.getByLabel("Email", { exact: true }).fill("local@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirm password").fill("correct-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill("local@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account/verify-email");
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Verify your email" })).toHaveCount(0);
});
