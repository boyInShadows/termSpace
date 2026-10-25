import { expect, test } from "@playwright/test";

for (const prefix of ["", "/fa"]) {
  test(`enforces fresh script nonces with working hydration (${prefix || "en"})`, async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { cspViolations: string[] }).cspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        (window as typeof window & { cspViolations: string[] }).cspViolations.push(`${event.effectiveDirective}: ${event.blockedURI}`);
      });
    });
    const response = await page.goto(`${prefix}/products/conversion-copywriter`);
    const policy = response!.headers()["content-security-policy"];
    const nonce = policy.match(/'nonce-([^']+)'/)![1];
    expect(policy).toContain("'strict-dynamic'");
    expect(policy.split(";").find((directive) => directive.trim().startsWith("script-src "))).not.toMatch(/unsafe-inline|unsafe-eval/);
    await expect(page.locator("html")).toHaveAttribute("lang", prefix ? "fa" : "en");
    await expect(page.locator("html")).toHaveClass(/dark|light/);
    const html = await response!.text();
    const serverScripts = [...html.matchAll(/<script([^>]*)>/g)];
    expect(serverScripts.length).toBeGreaterThan(0);
    expect(serverScripts.every((script) => script[1].includes(`nonce="${nonce}"`))).toBe(true);
    expect(await page.locator('script[type="application/ld+json"]').evaluate((script) => (script as HTMLScriptElement).nonce)).toBe(nonce);
    await expect.poll(() => page.evaluate(() => (window as typeof window & { cspViolations: string[] }).cspViolations)).toEqual([]);
    await page.route("**/products/conversion-copywriter", async (route) => {
      const original = await route.fetch();
      const body = (await original.text()).replace("</body>", "<script>window.unauthorizedScriptRan = true</script></body>");
      await route.fulfill({ response: original, body });
    }, { times: 1 });
    const reload = await page.reload();
    await expect.poll(() => page.evaluate(() => (window as typeof window & { cspViolations: string[] }).cspViolations.some((value) => value.includes("script-src") && value.endsWith(": inline")))).toBe(true);
    expect(await page.evaluate(() => (window as typeof window & { unauthorizedScriptRan?: boolean }).unauthorizedScriptRan)).toBeUndefined();
    expect(reload!.headers()["content-security-policy"]).not.toContain(`'nonce-${nonce}'`);
  });
}
