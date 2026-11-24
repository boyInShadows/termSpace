import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalytics, readConsent, saveConsent } from "../../../../../shared/analytics/browser";
import { analyticsPage, privacySignal, validMeasurementId } from "../../../../../shared/analytics/policy";

const id = "G-TEST12345";
const disableKey = `ga-disable-${id}`;
const tagSelector = 'script[src^="https://www.googletagmanager.com/gtag/js"]';
const browser = window as typeof window & { dataLayer?: IArguments[]; gtag?: unknown; [disableKey]?: boolean };
const commands = () => (browser.dataLayer ?? []).map((command) => Array.from(command));
const events = () => commands().filter(([command]) => command === "event");

afterEach(() => {
  history.replaceState(null, "", "/");
  document.querySelectorAll(tagSelector).forEach((script) => script.remove());
  for (const cookie of document.cookie.split(";")) {
    document.cookie = `${cookie.split("=")[0].trim()}=; Max-Age=0; Path=/`;
  }
  delete browser.dataLayer;
  delete browser.gtag;
  delete browser[disableKey];
  vi.unstubAllGlobals();
});

describe("GA4 public routes", () => {
  it("classifies public pages and keeps private paths out of both streams", () => {
    expect(analyticsPage("marketplace", "/fa/products/user-input")).toEqual({
      path: "/fa/products/:slug", pageType: "listing", locale: "fa",
    });
    expect(analyticsPage("journal", "/blog/tag/visible")).toEqual({
      path: "/blog/tag/:slug", pageType: "tag", locale: "en",
    });
    for (const path of ["/account/reset-password", "/fa/dashboard/library", "/moderation/cases", "/support", "/admin/login", "/fa/preview/token"]) {
      expect(analyticsPage("marketplace", path)).toBeNull();
      expect(analyticsPage("journal", path)).toBeNull();
    }
  });

  it("detects request privacy signals and rejects invalid measurement IDs", () => {
    expect(privacySignal(new Headers({ "sec-gpc": "1" }))).toBe(true);
    expect(privacySignal(new Headers({ dnt: "1" }))).toBe(true);
    expect(privacySignal(new Headers({ dnt: "0" }))).toBe(false);
    expect(validMeasurementId(" G-TEST12345 ")).toBe(id);
    expect(validMeasurementId("GTM-TEST12345")).toBeUndefined();
    expect(validMeasurementId("G-TEST&l=alternate")).toBeUndefined();
  });
});

describe("Basic Consent Mode", () => {
  it("blocks initial and denied loads and keeps the two choices independent", () => {
    document.cookie = "termspace_web_analytics=old.allow; Path=/";
    const marketplace = createAnalytics("marketplace", id, false);
    marketplace.sync();
    expect(marketplace.choose("deny")).toBe(true);
    marketplace.track("listing_click");
    expect(document.querySelector(tagSelector)).toBeNull();
    expect(commands()).toEqual([]);
    expect(readConsent("journal")).toBeNull();
    expect(readConsent("marketplace")).toBe("deny");
  });

  it("honors browser and request privacy signals even with a saved grant", () => {
    saveConsent("marketplace", "allow");
    createAnalytics("marketplace", id, true).sync();
    vi.stubGlobal("navigator", { doNotTrack: "1" });
    createAnalytics("marketplace", id, false).sync();
    expect(document.querySelector(tagSelector)).toBeNull();
    expect(commands()).toEqual([]);
  });

  it("queues only sanitized public page views and discovery events", () => {
    history.replaceState(null, "", "/fa/explore?q=user%40example.test#fragment");
    const tracker = createAnalytics("marketplace", id, false);
    expect(tracker.choose("allow")).toBe(true);
    expect(document.querySelector(tagSelector)).toBeInstanceOf(HTMLScriptElement);
    tracker.track("listing_click");
    tracker.track("install_command_copy");
    history.replaceState(null, "", "/fa/explore?q=another-query");
    tracker.sync();
    history.pushState(null, "", "/fa/products/private-looking-slug?token=ignored");
    tracker.sync();
    tracker.track("install_command_copy");
    expect(events().map(([, name]) => name)).toEqual(["page_view", "listing_click", "page_view", "install_command_copy"]);
    expect(events().at(-1)?.[2]).toMatchObject({
      page_location: `${location.origin}/fa/products/:slug`,
      page_referrer: `${location.origin}/fa/explore`,
      page_title: "listing", site_locale: "fa",
    });
    expect(JSON.stringify(commands())).not.toMatch(/private-looking-slug|user%40example|fragment|another-query|token=ignored/);
  });

  it("suspends a loaded tag on an excluded route and removes only its GA cookies on withdrawal", () => {
    const tracker = createAnalytics("marketplace", id, false);
    tracker.choose("allow");
    document.querySelector(tagSelector)?.dispatchEvent(new Event("load"));
    history.pushState(null, "", "/account/confirm-email?token=private");
    tracker.sync();
    tracker.track("listing_click");
    expect(browser[disableKey]).toBe(true);
    expect(events()).toHaveLength(1);

    document.cookie = "ts_web_ga=web; Path=/";
    document.cookie = "ts_web_ga_TEST12345=stream; Path=/";
    document.cookie = "ts_blog_ga=blog; Path=/";
    expect(tracker.choose("deny")).toBe(true);
    expect(commands().at(-1)).toEqual(["consent", "update", expect.objectContaining({ analytics_storage: "denied" })]);
    expect(document.cookie).not.toContain("ts_web_ga");
    expect(document.cookie).toContain("ts_blog_ga=blog");
    history.pushState(null, "", "/");
    tracker.sync();
    expect(events()).toHaveLength(1);
  });

  it("discards queued grants and events when consent changes before the tag loads", () => {
    const tracker = createAnalytics("marketplace", id, false);
    tracker.choose("allow");
    saveConsent("marketplace", "deny");
    tracker.sync();
    expect(browser[disableKey]).toBe(true);
    expect(commands()).toEqual([]);
    expect(document.querySelector(tagSelector)).toBeNull();
  });
});
