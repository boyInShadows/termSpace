export type AnalyticsSite = "marketplace" | "journal";
export type AnalyticsLocale = "en" | "fa";

export const COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

export function cookieSettingsLabel(locale: AnalyticsLocale) {
  return locale === "fa" ? "تنظیمات کوکی‌ها" : "Cookie settings";
}

export const siteCookies = {
  marketplace: { preference: "termspace_web_analytics", gaPrefix: "ts_web" },
  journal: { preference: "termspace_blog_analytics", gaPrefix: "ts_blog" },
} satisfies Record<AnalyticsSite, { preference: string; gaPrefix: string }>;

const publicPages: Record<AnalyticsSite, [RegExp, string, string][]> = {
  marketplace: [
    [/^\/$/, "/", "home"],
    [/^\/explore$/, "/explore", "explore"],
    [/^\/communities$/, "/communities", "communities"],
    [/^\/communities\/[^/]+$/, "/communities/:slug", "community"],
    [/^\/products\/[^/]+$/, "/products/:slug", "listing"],
    [/^\/creators\/[^/]+$/, "/creators/:handle", "creator"],
  ],
  journal: [
    [/^\/$/, "/", "home"],
    [/^\/blog$/, "/blog", "articles"],
    [/^\/blog\/[^/]+$/, "/blog/:slug", "article"],
    [/^\/topics$/, "/topics", "topics"],
    [/^\/blog\/category\/[^/]+$/, "/blog/category/:slug", "category"],
    [/^\/blog\/tag\/[^/]+$/, "/blog/tag/:slug", "tag"],
    [/^\/blog\/series\/[^/]+$/, "/blog/series/:slug", "series"],
    [/^\/editions$/, "/editions", "editions"],
    [/^\/editions\/[^/]+$/, "/editions/:slug", "edition"],
    [/^\/resources$/, "/resources", "resources"],
    [/^\/resources\/[^/]+$/, "/resources/:slug", "resource"],
  ],
};

export function analyticsPage(site: AnalyticsSite, pathname: string) {
  const fa = pathname === "/fa" || pathname.startsWith("/fa/");
  const path = (fa ? pathname.slice(3) : pathname).replace(/\/$/, "") || "/";
  const match = publicPages[site].find(([pattern]) => pattern.test(path));
  if (!match) return null;
  const [, template, pageType] = match;
  return {
    path: `${fa ? "/fa" : ""}${template}`,
    pageType,
    locale: fa ? "fa" : "en",
  } as const;
}

export function validMeasurementId(value: string | undefined) {
  const id = value?.trim();
  return id && /^G-[A-Z0-9]+$/.test(id) ? id : undefined;
}

export function privacySignal(headers: { get(name: string): string | null }) {
  return headers.get("sec-gpc") === "1" || headers.get("dnt") === "1";
}
