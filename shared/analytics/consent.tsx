"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { analyticsBlocked, createAnalytics, readConsent, type Consent } from "./browser";
import { analyticsPage, cookieSettingsLabel, siteCookies, type AnalyticsLocale, type AnalyticsSite } from "./policy";
import { DISCOVERY_EVENT } from "./discovery";
import styles from "./consent.module.css";

const copy = {
  en: {
    heading: "Analytics cookies",
    description: "Allow Google Analytics to help us understand how visitors use this site.",
    allow: "Accept analytics",
    deny: "Reject analytics",
    privacy: "Privacy policy",
    close: "Close",
    accepted: "Analytics is allowed on this site.",
    rejected: "Analytics is off on this site.",
    blocked: "Analytics is off because of your browser’s privacy settings.",
    error: "Your browser couldn’t save your choice. Check whether this site can store cookies and try again.",
  },
  fa: {
    heading: "کوکی‌های تحلیل بازدید",
    description: "با اجازهٔ شما، از گوگل آنالیتیکس برای بررسی نحوهٔ استفاده از این سایت کمک می‌گیریم.",
    allow: "پذیرفتن کوکی‌های تحلیلی",
    deny: "رد کردن کوکی‌های تحلیلی",
    privacy: "سیاست حریم خصوصی",
    close: "بستن",
    accepted: "تحلیل بازدید در این سایت فعال است.",
    rejected: "تحلیل بازدید در این سایت غیرفعال است.",
    blocked: "تحلیل بازدید به‌دلیل تنظیمات حریم خصوصی مرورگر شما غیرفعال است.",
    error: "مرورگر نتوانست انتخاب شما را ذخیره کند. بررسی کنید که ذخیرهٔ کوکی برای این سایت مجاز باشد و دوباره تلاش کنید.",
  },
} as const;

export type ConsentPanelProps = {
  site: AnalyticsSite;
  locale: AnalyticsLocale;
  privacyHref: string;
  headerSignal: boolean;
  measurementId: string;
};

export function ConsentPanel({ site, locale, privacyHref, headerSignal, measurementId }: ConsentPanelProps) {
  const pathname = usePathname();
  const tracker = useMemo(() => createAnalytics(site, measurementId, headerSignal), [site, measurementId, headerSignal]);
  const [choice, setChoice] = useState<Consent | null | undefined>(undefined);
  const [blocked, setBlocked] = useState(headerSignal);
  const [settingsTrigger, setSettingsTrigger] = useState<HTMLButtonElement | null>(null);
  const [saveError, setSaveError] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const statusId = useId();
  const text = copy[locale];
  const settings = settingsTrigger !== null;

  // A route change must disable an already-loaded tag before the new page paints.
  useLayoutEffect(() => {
    tracker.sync();
  }, [tracker, pathname]);

  useEffect(() => {
    function refresh() {
      tracker.sync();
      setChoice(readConsent(site));
      setBlocked(analyticsBlocked(headerSignal));
    }
    function onPopState() {
      if (!analyticsPage(site, location.pathname)) tracker.suspend();
    }
    function onPageHide(event: PageTransitionEvent) {
      if (event.persisted) tracker.suspend();
    }
    function onSettingsClick(event: MouseEvent) {
      const button = event.target instanceof Element && event.target.closest<HTMLButtonElement>("button[data-cookie-settings]");
      if (!button) return;
      refresh();
      setSettingsTrigger(button);
    }
    function onDiscovery(event: Event) {
      if (event instanceof CustomEvent && (event.detail === "listing_click" || event.detail === "install_command_copy")) {
        tracker.track(event.detail);
      }
    }
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("popstate", onPopState, true);
    document.addEventListener("visibilitychange", refresh);
    document.addEventListener("click", onSettingsClick);
    window.addEventListener(DISCOVERY_EVENT, onDiscovery);
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel(siteCookies[site].preference);
      channel.current.onmessage = refresh;
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("popstate", onPopState, true);
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("click", onSettingsClick);
      window.removeEventListener(DISCOVERY_EVENT, onDiscovery);
      channel.current?.close();
      channel.current = null;
    };
  }, [site, headerSignal, tracker]);

  useLayoutEffect(() => {
    if (settings) heading.current?.focus({ preventScroll: true });
  }, [settings]);

  function closeSettings() {
    setSaveError(false);
    settingsTrigger?.focus({ preventScroll: true });
    setSettingsTrigger(null);
  }

  function choose(next: Consent) {
    if (!tracker.choose(next)) {
      setSaveError(true);
      return;
    }
    setChoice(next);
    channel.current?.postMessage("changed");
    closeSettings();
  }

  const initialBanner = choice === null && !blocked && pathname && analyticsPage(site, pathname);
  if (!initialBanner && !settings) return null;

  return (
    <aside className={styles.panel} data-site={site} aria-labelledby={titleId} aria-describedby={statusId} onKeyDown={(event) => {
      if (settings && event.key === "Escape") closeSettings();
    }}>
      <h2 id={titleId} ref={heading} tabIndex={-1}>{settings ? cookieSettingsLabel(locale) : text.heading}</h2>
      <p id={statusId}>
        {blocked ? text.blocked : choice === "allow" ? text.accepted : choice === "deny" ? text.rejected : text.description}
      </p>
      {saveError && <p role="alert">{text.error}</p>}
      {!blocked && (
        <div className={styles.actions}>
          <button type="button" onClick={() => choose("deny")}>{text.deny}</button>
          <button type="button" onClick={() => choose("allow")}>{text.allow}</button>
        </div>
      )}
      <div className={styles.links}>
        <a href={privacyHref}>{text.privacy}</a>
        {settings && <button type="button" onClick={closeSettings}>{text.close}</button>}
      </div>
    </aside>
  );
}
