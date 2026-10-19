import { expect, test } from "@playwright/test";

test("signup asks the reader to verify and sign in, and the email link verifies the session", async ({ page }) => {
  let authenticated = false;
  let verified = false;
  await page.route("**/backend/api/marketplace/favorites", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/backend/api/readers/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const session = () => ({ authenticated: true, user: { id: "reader-e2e", email: "signup@e2e.test", emailVerified: verified, marketplaceRoles: [] } });
    // Registering starts no session; the reader signs in afterwards.
    if (path.endsWith("/register")) { await route.fulfill({ status: 202, json: { data: { accepted: true } } }); return; }
    if (path.endsWith("/login")) { authenticated = true; await route.fulfill({ json: { data: session() } }); return; }
    if (path.endsWith("/email-verification/confirm")) {
      expect(route.request().postDataJSON()).toEqual({ token: "test-verification.signature" });
      verified = true;
      await route.fulfill({ json: { data: { verified: true } } });
      return;
    }
    await route.fulfill({ json: { data: authenticated ? session() : { authenticated: false } } });
  });
  await page.goto("/account");
  await page.getByRole("button", { name: "Need an account? Register" }).click();
  await page.getByLabel("Email", { exact: true }).fill("signup@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirm password").fill("correct-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox for a verification link");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("signup@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.goto("/account/verify-email");
  await expect(page.getByRole("button", { name: "Resend verification" })).toBeVisible();
  await page.goto("/");
  await page.goto("/account/verify-email#token=test-verification.signature");
  await expect(page.getByRole("link", { name: "Return to account" })).toBeVisible();
  await expect(page).toHaveURL(/\/account\/verify-email$/);
});

test("password recovery returns to sign-in after submitting the emailed code", async ({ page }) => {
  await page.route("**/backend/api/readers/password-reset/**", async (route) => {
    const confirm = route.request().url().endsWith("/confirm");
    if (confirm) expect(route.request().postDataJSON()).toEqual({ email: "reader@e2e.test", code: "123456", newPassword: "replacement-password" });
    await route.fulfill({ json: { data: confirm ? { reset: true } : { accepted: true } } });
  });
  await page.goto("/account");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("reader@e2e.test");
  await page.getByRole("button", { name: "Send reset code" }).click();
  await page.getByLabel("Reset code", { exact: true }).fill("123456");
  await page.getByLabel("New password", { exact: true }).fill("replacement-password");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("local signup skips the inbox box and accepted sessions leave the verification page", async ({ page }) => {
  let authenticated = false;
  const session = { authenticated: true, user: { id: "local-reader", email: "local@e2e.test", emailVerified: true, marketplaceRoles: [] } };
  await page.route("**/backend/api/marketplace/favorites", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/backend/api/readers/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/register")) { await route.fulfill({ status: 202, json: { data: { accepted: true } } }); return; }
    if (url.endsWith("/login")) authenticated = true;
    await route.fulfill({ json: { data: authenticated ? session : { authenticated: false } } });
  });
  await page.goto("/account");
  await page.getByRole("button", { name: "Need an account? Register" }).click();
  await page.getByLabel("Email", { exact: true }).fill("local@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirm password").fill("correct-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("local@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account/verify-email");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Verify your email" })).toHaveCount(0);
});
