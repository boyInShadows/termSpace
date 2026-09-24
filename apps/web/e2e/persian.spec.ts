import { expect, test } from "@playwright/test";

test.describe("persian", () => {
  test("/fa is right-to-left, set in Estedad, with untracked eyebrows", async ({ page }) => {
    await page.goto("/fa");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");

    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont.toLowerCase()).toContain("estedad");

    // Tracking pulls a joined script apart, so no eyebrow may carry any.
    const tracked = await page.locator(".eyebrow").evaluateAll((nodes) =>
      nodes
        .map((node) => ({ text: node.textContent?.trim() ?? "", spacing: getComputedStyle(node).letterSpacing }))
        .filter(({ spacing }) => spacing !== "normal" && parseFloat(spacing) !== 0),
    );
    expect(tracked).toEqual([]);
  });
});
