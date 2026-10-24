import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import { reportingCopy } from "../features/reporting/copy";

async function identity(context: BrowserContext, persona: "reader" | "staff") {
  await context.addCookies([{ name: "e2e_persona", value: persona, domain: "127.0.0.1", path: "/" }, { name: "e2e_reports", value: randomUUID(), domain: "127.0.0.1", path: "/" }]);
}

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : "";
  const t = reportingCopy[locale];
  const listing = `${prefix}/products/conversion-copywriter`;
  const casePath = `${prefix}/moderation/cases/case-fixture-1`;

  test(`report entry preserves localized sign-in and the root keyboard target (${locale})`, async ({ page }) => {
    await page.goto(listing);
    await page.locator("#report-listing summary").click();
    await expect(page.getByRole("link", { name: t.signIn, exact: true })).toHaveAttribute("href", `${prefix}/account?next=${encodeURIComponent(listing)}`);
    await expect(page.locator("main#content")).toHaveCount(1);
    await page.reload();
    await page.keyboard.press("Tab");
    await expect(page.locator("a[href='#content']")).toBeFocused();
  });

  test(`reports retain text through disclosure and rate-limit recovery (${locale})`, async ({ page, context }) => {
    await identity(context, "reader");
    let attempts = 0;
    let submitted: unknown;
    await page.route("**/backend/api/marketplace/products/*/reports", async (route) => {
      attempts += 1; submitted = route.request().postDataJSON();
      if (attempts === 1) return route.fulfill({ status: 429, json: { error: { code: "REPORT_RATE_LIMITED", message: "Too many" } } });
      await route.continue();
    });
    await page.goto(listing);
    const summary = page.locator("#report-listing summary");
    await summary.focus(); await page.keyboard.press("Enter");
    const explanation = page.getByRole("textbox", { name: t.explanation, exact: true });
    await explanation.fill("The installation script sends credentials to an unrelated server.");
    await summary.click(); await expect(explanation).toBeHidden(); await summary.click();
    await expect(explanation).toHaveValue("The installation script sends credentials to an unrelated server.");
    await page.getByRole("combobox", { name: t.reason, exact: true }).selectOption("MISLEADING");
    await page.getByRole("button", { name: t.send, exact: true }).click();
    await expect(page.locator("#report-listing").getByRole("alert")).toHaveText(t.limited);
    await expect(explanation).toHaveValue("The installation script sends credentials to an unrelated server.");
    await page.getByRole("button", { name: t.send, exact: true }).click();
    await expect(page.locator("#report-listing").getByRole("status")).toContainText(t.received);
    expect(submitted).toEqual({ reason: "MISLEADING", explanation: "The installation script sends credentials to an unrelated server." });
    await expect(page.getByText("fixture-receipt-MISLEADING", { exact: true })).toBeVisible();
  });

  test(`staff reach the queue, filter and page with reloadable URLs (${locale})`, async ({ page, context }) => {
    await identity(context, "staff");
    await page.goto(`${prefix}/moderation`);
    await page.getByRole("link", { name: t.cases, exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(24);
    await page.getByRole("combobox", { name: t.filter, exact: true }).selectOption("NEW");
    await page.getByRole("button", { name: t.apply, exact: true }).click();
    await expect(page).toHaveURL(`${prefix}/moderation/cases?state=NEW`);
    await page.getByRole("link", { name: t.next, exact: true }).click();
    await expect(page).toHaveURL(`${prefix}/moderation/cases?page=2&state=NEW`);
    await expect(page.getByRole("article")).toHaveCount(1);
    await page.reload(); await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("link", { name: t.previous, exact: true }).click();
    await page.getByRole("link", { name: t.openCase, exact: true }).first().click();
    await expect(page).toHaveURL(casePath);
    await expect(page.getByRole("heading", { name: t.evidence, exact: true })).toBeVisible();
  });

  test(`case evidence and history page independently without executing reports (${locale})`, async ({ page, context }) => {
    await identity(context, "staff");
    await page.goto(casePath);
    const reports = page.getByRole("region", { name: t.evidence, exact: true });
    const history = page.getByRole("region", { name: t.history, exact: true });
    await expect(reports.getByRole("article")).toHaveCount(12);
    await expect(reports.getByText(/<script>untrusted\(\)<\/script>/)).toBeVisible();
    expect(await page.evaluate(() => "untrusted" in window)).toBe(false);
    await reports.getByRole("link", { name: t.next, exact: true }).click();
    await expect(page).toHaveURL(`${casePath}?reportsPage=2&eventsPage=1`);
    await expect(reports.getByRole("article")).toHaveCount(1);
    await history.getByRole("link", { name: t.next, exact: true }).click();
    await expect(page).toHaveURL(`${casePath}?reportsPage=2&eventsPage=2`);
    await expect(history.getByRole("article")).toHaveCount(1);
    await page.reload(); await expect(reports.getByRole("article")).toHaveCount(1); await expect(history.getByRole("article")).toHaveCount(1);
  });

  test(`staff decisions append history and resolved decisions remain closed (${locale})`, async ({ page, context }) => {
    await identity(context, "staff");
    await page.goto(casePath);
    await page.getByRole("combobox", { name: t.action, exact: true }).selectOption("INVESTIGATE");
    await page.getByRole("combobox", { name: t.severity, exact: true }).selectOption("HIGH");
    await page.getByLabel(t.reasonCode, { exact: false }).fill("SOURCE_REVIEW");
    await page.getByLabel(t.publicReason, { exact: false }).fill("The source is being investigated.");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await expect(page.getByText(t.saved, { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: t.history }).getByText("The source is being investigated.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(t.states.INVESTIGATING, { exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: t.action, exact: true }).selectOption("DISMISS");
    await page.getByLabel(t.reasonCode, { exact: false }).fill("NO_VIOLATION");
    await page.getByLabel(t.publicReason, { exact: false }).fill("The evidence does not establish a violation.");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await expect(page.getByText(t.closed, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: t.save, exact: true })).toHaveCount(0);
    await page.reload(); await expect(page.getByText(t.closed, { exact: true })).toBeVisible();
  });

  test(`a stale staff write requires explicit reload and keeps entered evidence (${locale})`, async ({ page, context }) => {
    await identity(context, "staff");
    let version = 0;
    let attempts = 0;
    await page.route("**/backend/api/marketplace/moderation/cases/case-fixture-1{,/triage}", async (route) => {
      if (route.request().method() === "POST") {
        attempts += 1;
        if (attempts === 1) { version = 1; return route.fulfill({ status: 409, json: { error: { code: "CASE_VERSION_CONFLICT", message: "Changed" } } }); }
        expect(route.request().postDataJSON().expectedVersion).toBe(1);
        return route.fulfill({ status: 200, json: { data: { id: "case-fixture-1", state: "TRIAGED", severity: "STANDARD", version: 2 } } });
      }
      const response = await route.fetch(); const body = await response.json(); body.data.version = version;
      await route.fulfill({ response, json: body });
    });
    await page.goto(casePath);
    const reason = page.getByLabel(t.reasonCode, { exact: false });
    const publicReason = page.getByLabel(t.publicReason, { exact: false });
    await reason.fill("SOURCE_REVIEW"); await publicReason.fill("The source is being investigated.");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText(t.conflict);
    await expect(page.getByRole("button", { name: t.save, exact: true })).toBeDisabled();
    await expect(publicReason).toHaveValue("The source is being investigated.");
    await page.getByRole("button", { name: t.reload, exact: true }).click();
    await expect(page.getByRole("button", { name: t.save, exact: true })).toBeEnabled();
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await expect(page.getByText(t.saved, { exact: true })).toBeVisible();
    await expect(page.locator("main [aria-busy]")).toHaveAttribute("aria-busy", "false");
    await page.unrouteAll({ behavior: "wait" });
  });

  test(`ordinary readers cannot fetch case evidence (${locale})`, async ({ page, context }) => {
    await identity(context, "reader");
    const requests: string[] = [];
    page.on("request", (request) => { if (request.url().includes("/backend/api/marketplace/moderation/cases")) requests.push(request.url()); });
    await page.goto(casePath);
    await expect(page.locator("main").getByRole("alert")).toHaveText(t.denied);
    await expect(page.getByRole("heading", { name: t.evidence, exact: true })).toHaveCount(0);
    expect(requests).toEqual([]);
  });
}
