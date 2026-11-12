import { chromium, expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { supportCopy } from "../features/support/support-copy";
import { copy } from "../lib/i18n";
import { supportFixture } from "./support-fixture";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
});

for (const locale of ["en", "fa"] as const) {
  const prefix = locale === "fa" ? "/fa" : ""; const text = supportCopy[locale];
  for (const staff of [false, true]) {
    test(`sidebar opens support while phone tabs stay unchanged (${locale}, staff=${staff})`, async ({ page, context, baseURL }, info) => {
      await context.addCookies([{ name: "e2e_persona", value: staff ? "staff" : "reader", url: baseURL! }]);
      await page.addInitScript(theme => localStorage.setItem("theme", theme), staff ? "dark" : "light");
      await supportFixture(page, { staff });
      await page.goto(`${prefix}/dashboard/library`);
      const tabs = page.getByRole("navigation", { name: copy[locale].dashboardHome.tabsLabel, includeHidden: true });
      await expect(tabs.getByRole("link", { name: text.title, includeHidden: true })).toHaveCount(0);
      await expect(tabs.locator("a")).toHaveCount(staff ? 6 : 5);
      if (info.project.name.startsWith("mobile")) { await expect(tabs).toBeVisible(); return; }
      const sidebar = page.getByRole("navigation", { name: copy[locale].dashboard, exact: true });
      const support = sidebar.getByRole("link", { name: text.title, exact: true });
      await expect(support).toBeVisible(); await expect(support).not.toHaveAttribute("aria-current");
      await support.focus(); await support.press("Enter");
      await expect(page.getByRole("heading", { name: text.title, level: 1, exact: true })).toBeVisible();
      await expect(support).toHaveAttribute("aria-current", "page");
      await support.focus();
      expect(await support.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
      await page.screenshot({ path: info.outputPath(`support-sidebar-${locale}-${staff ? "staff-dark" : "member-light"}.png`) });
    });
  }
  for (const theme of ["light", "dark"] as const) {
    test(`member creates, replies, resolves and reopens (${locale}, ${theme})`, async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const fixture = await supportFixture(page, { empty: true });
      await page.goto(`${prefix}/dashboard/tickets`);
      await expect(page.getByText(text.empty, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: text.inbox, exact: true })).toHaveCount(0);
      await page.getByRole("link", { name: text.new, exact: true }).click();
      await page.getByLabel(text.subject, { exact: true }).fill(locale === "en" ? "My private question" : "پرسش خصوصی من");
      await page.getByLabel(text.message, { exact: true }).fill("First line\nSecond line");
      await page.getByRole("button", { name: text.create, exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: text.created })).toBeVisible();
      await expect(page.getByText("First line\nSecond line", { exact: true })).toBeVisible();
      const reply = page.getByLabel(text.reply, { exact: true }); await reply.fill("A reply\nwith a second line");
      await reply.press("Enter"); expect(fixture.writes()).toBe(1);
      await page.getByRole("button", { name: text.send, exact: true }).click();
      await expect(reply).toHaveValue("");
      await page.getByRole("button", { name: text.resolve, exact: true }).click();
      await expect(page.getByText(text.resolved, { exact: true })).toBeVisible();
      await reply.fill("Still need help"); await page.getByRole("button", { name: text.reopen, exact: true }).click();
      await expect(page.getByText(text.statuses.WAITING_FOR_SUPPORT, { exact: true })).toBeVisible();
      expect(fixture.writes()).toBe(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole("banner")).toHaveCount(1);
    });
  }
  test(`filters live in the URL and failed data is not an empty state (${locale})`, async ({ page }) => {
    const fixture = await supportFixture(page);
    await page.goto(`${prefix}/dashboard/tickets`);
    await expect(page.getByText("Help publishing my listing", { exact: true })).toBeVisible();
    await page.getByLabel(text.search, { exact: true }).fill("not-found"); await page.getByRole("button", { name: text.apply, exact: true }).click();
    await expect(page).toHaveURL(/q=not-found/); await expect(page.getByText(text.noMatches, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: text.clear }).click();
    await expect(page.getByText("Help publishing my listing", { exact: true })).toBeVisible();
    fixture.fail(400); await page.reload(); await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page.getByText(text.empty, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: text.retry }).click(); await expect(page.getByText("Help publishing my listing", { exact: true })).toBeVisible();
  });
  test(`staff inbox has local switching and resolved conversations block ordinary staff replies (${locale})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "e2e_persona", value: "staff", url: baseURL! }]);
    const fixture = await supportFixture(page, { staff: true });
    await page.goto(`${prefix}/dashboard/tickets/inbox`);
    await expect(page.getByRole("link", { name: text.mine, exact: true })).toBeVisible();
    await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Help publishing my listing" }) }).click();
    await page.getByLabel(text.reply, { exact: true }).fill("A support response"); await page.getByRole("button", { name: text.send, exact: true }).click();
    await expect(page.getByText(text.staffWaiting, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: text.resolve, exact: true }).click();
    await expect(page.getByText(text.staffResolved, { exact: true })).toBeVisible();
    await expect(page.getByLabel(text.reply, { exact: true })).toHaveCount(0);
    expect(fixture.ticket().status).toBe("RESOLVED");
  });
  test(`keyboard cancellation and conflict preserve drafts (${locale})`, async ({ page }, info) => {
    const fixture = await supportFixture(page);
    await page.goto(`${prefix}/dashboard/tickets`);
    await page.locator(`main a[href="${prefix}/dashboard/tickets/ticket-fixture-1"]`).click();
    const reply = page.getByLabel(text.reply, { exact: true }); await reply.fill("Keep this text");
    fixture.fail(409); await page.getByRole("button", { name: text.send, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: text.conflict })).toBeVisible();
    await expect(reply).toHaveValue("Keep this text"); expect(fixture.writes()).toBe(1);
    page.once("dialog", dialog => dialog.dismiss());
    const back = page.getByRole("link", { name: text.back, exact: true }); await back.focus(); await back.press("Enter");
    await expect(reply).toHaveValue("Keep this text");
    await Promise.all([page.waitForEvent("dialog").then(dialog => dialog.dismiss()), page.evaluate(() => history.back())]);
    await expect(reply).toHaveValue("Keep this text");
    expect(await back.evaluate(element => { const style = getComputedStyle(element); return style.outlineStyle !== "none" || style.boxShadow !== "none"; })).toBe(true);
    const tabs = page.getByRole("navigation", { name: copy[locale].dashboardHome.tabsLabel, includeHidden: true });
    await expect(tabs).toHaveCount(1);
    if (info.project.name.startsWith("mobile")) await expect(tabs).toBeVisible();
    else await expect(tabs).toBeHidden();
  });
  test(`support controls remain reachable at real 200% zoom in a short window (${locale})`, async ({ baseURL }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "Native desktop browser zoom");
    const profile = info.outputPath("support-zoom");
    await mkdir(path.join(profile, "Default"), { recursive: true });
    await writeFile(path.join(profile, "Default", "Preferences"), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(profile, {
      channel: process.env.PW_CHANNEL ?? "chromium", headless: true, viewport: null, deviceScaleFactor: undefined,
      reducedMotion: "reduce", args: ["--window-size=1280,900"],
    });
    try {
      await context.addCookies([{ name: "e2e_persona", value: "reader", url: baseURL! }]);
      const page = context.pages()[0]; await supportFixture(page, { many: true });
      for (const route of ["", "/new", "/ticket-fixture-1"]) {
        await page.goto(`${baseURL}${prefix}/dashboard/tickets${route}`);
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      const reply = page.getByLabel(text.reply, { exact: true }); await reply.fill("Keyboard draft"); await reply.press("Tab");
      const send = page.getByRole("button", { name: text.send, exact: true }); await expect(send).toBeFocused();
      await expect.poll(() => send.evaluate(element => {
        const rect = element.getBoundingClientRect(); const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(x, y);
        return x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && (hit === element || (hit !== null && element.contains(hit)));
      })).toBe(true);
    } finally { await context.close(); }
  });
}
