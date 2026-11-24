import { analyticsPage, COOKIE_MAX_AGE, siteCookies, type AnalyticsSite } from "./policy";
import type { DiscoveryEvent } from "./discovery";

export type Consent = "allow" | "deny";

const version = "v1";
const deniedConsent = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

type GoogleWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...command: unknown[]) => void;
};

function cookieNames() {
  return document.cookie.split(";").map((cookie) => cookie.trim());
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function readConsent(site: AnalyticsSite): Consent | null {
  const prefix = `${siteCookies[site].preference}=${version}.`;
  const choice = cookieNames().find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length);
  return choice === "allow" || choice === "deny" ? choice : null;
}

export function saveConsent(site: AnalyticsSite, choice: Consent) {
  writeCookie(siteCookies[site].preference, `${version}.${choice}`, COOKIE_MAX_AGE);
  return readConsent(site) === choice;
}

function deleteAnalyticsCookies(site: AnalyticsSite) {
  const prefix = `${siteCookies[site].gaPrefix}_ga`;
  for (const cookie of cookieNames()) {
    const name = cookie.split("=", 1)[0];
    if (name === prefix || name.startsWith(`${prefix}_`)) writeCookie(name, "", 0);
  }
}

export function analyticsBlocked(headerSignal: boolean) {
  const browser = navigator as Navigator & { globalPrivacyControl?: boolean };
  return headerSignal || browser.doNotTrack === "1" || browser.globalPrivacyControl === true;
}

export function createAnalytics(site: AnalyticsSite, id: string, headerSignal: boolean) {
  let script: HTMLScriptElement | undefined;
  let scriptLoaded = false;
  let started = false;
  let lastPath: string | undefined;
  let lastLocation: string | undefined;
  let pageFields: Record<string, string> | undefined;
  let denyForDocument = false;
  const pendingCommands: IArguments[] = [];
  const disableKey = `ga-disable-${id}`;

  const tag: NonNullable<GoogleWindow["gtag"]> = function () {
    const browser = window as GoogleWindow;
    // gtag.js distinguishes its Arguments commands from generic data-layer messages.
    const command = arguments; // eslint-disable-line prefer-rest-params
    (browser.dataLayer ??= []).push(command);
    if (!scriptLoaded) pendingCommands.push(command);
  };

  function pause(withdrawn: boolean) {
    const browser = window as GoogleWindow;
    Reflect.set(browser, disableKey, true);
    lastPath = undefined;
    lastLocation = undefined;
    pageFields = undefined;

    if (script && !scriptLoaded) {
      script.remove();
      script = undefined;
      // A tag that finishes loading during withdrawal must not consume an old grant or an event.
      const layer = browser.dataLayer;
      if (layer) {
        for (const command of pendingCommands) {
          const index = layer.indexOf(command);
          if (index !== -1) layer.splice(index, 1);
        }
      }
      pendingCommands.length = 0;
      started = false;
    }
    if (withdrawn) {
      if (started) tag("consent", "update", deniedConsent);
      started = false;
      deleteAnalyticsCookies(site);
    }
  }

  function loadScript() {
    if (script) return;
    const element = document.createElement("script");
    element.async = true;
    element.referrerPolicy = "no-referrer";
    element.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    element.onload = () => {
      if (script !== element) return;
      scriptLoaded = true;
      pendingCommands.length = 0;
    };
    element.onerror = () => {
      if (script === element) pause(false);
    };
    script = element;
    document.head.append(element);
  }

  function sync() {
    const pathname = location.pathname;
    const page = analyticsPage(site, pathname);
    if (denyForDocument || analyticsBlocked(headerSignal) || readConsent(site) !== "allow") {
      pause(true);
      return;
    }
    if (!page) {
      pause(false);
      return;
    }
    if (lastPath === pathname) return;

    const pageLocation = `${location.origin}${page.path}`;
    pageFields = {
      page_location: pageLocation,
      page_referrer: lastLocation ?? `${location.origin}/`,
      page_title: page.pageType,
      page_type: page.pageType,
      site_locale: page.locale,
    };
    lastLocation = pageLocation;
    lastPath = pathname;

    const browser = window as GoogleWindow;
    Reflect.set(browser, disableKey, false);
    browser.gtag = tag;
    if (!started) {
      tag("consent", "default", deniedConsent);
      tag("consent", "update", { ...deniedConsent, analytics_storage: "granted" });
      tag("js", new Date());
      tag("set", pageFields);
      tag("config", id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
        cookie_prefix: siteCookies[site].gaPrefix,
        cookie_expires: COOKIE_MAX_AGE,
        cookie_update: false,
        cookie_flags: location.protocol === "https:" ? "SameSite=Lax;Secure" : "SameSite=Lax",
      });
      started = true;
    } else {
      tag("set", pageFields);
    }
    tag("event", "page_view", { ...pageFields, send_to: id });
    loadScript();
  }

  return {
    sync,
    choose(choice: Consent) {
      const saved = saveConsent(site, choice);
      denyForDocument = choice === "deny" && !saved;
      sync();
      return saved;
    },
    suspend() {
      pause(false);
    },
    track(event: DiscoveryEvent) {
      if (site !== "marketplace" || lastPath !== location.pathname || !pageFields) return;
      if (event === "install_command_copy" && pageFields.page_type !== "listing") return;
      if (denyForDocument || analyticsBlocked(headerSignal) || readConsent(site) !== "allow") {
        pause(true);
        return;
      }
      tag("event", event, { ...pageFields, send_to: id });
    },
  };
}
