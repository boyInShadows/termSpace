import { expect, test } from "@playwright/test";

/**
 * WCAG 2.2 target size (2.5.8): every pointer target is at least 24 by 24 CSS
 * pixels. Links running inside a sentence are exempt, and a native radio or
 * checkbox counts through the label that wraps it.
 */
const PAGES = [
  { path: "/", persona: null },
  { path: "/explore", persona: null },
  { path: "/products/conversion-copywriter", persona: null },
  { path: "/account", persona: null },
  { path: "/dashboard", persona: "creator" },
];

for (const { path, persona } of PAGES) {
  test(`every target on ${path} is at least 24px`, async ({ page, context, baseURL }) => {
    if (persona) await context.addCookies([{ name: "e2e_persona", value: persona, url: baseURL! }]);
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    const small = await page.evaluate(() => {
      const offenders: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [role=tab], [role=switch]")) {
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;
        let box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
          const wrap = el.closest("label") ?? el.labels?.[0];
          if (wrap) box = wrap.getBoundingClientRect();
        }
        const inSentence = el.tagName === "A" && style.display === "inline" && el.closest("p, li");
        if (!inSentence && (box.width < 24 || box.height < 24)) {
          offenders.push(`${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
        }
      }
      return offenders;
    });
    expect(small).toEqual([]);
  });
}
