"use client";
import Script from "next/script";

type Locale = "en" | "fa";

type ChatwootSettings = {
  locale?: string;
  position?: "left" | "right";
  type?: "standard" | "expanded_bubble";
  launcherTitle?: string;
  darkMode?: "light" | "auto" | "dark";
  showPopoutButton?: boolean;
  availableMessage?: string;
  unavailableMessage?: string;
};

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: { run: (options: { websiteToken: string; baseUrl: string }) => void };
  }
}

const DEFAULT_BASE_URL = "https://chat.termspace.dev";

/**
 * Termbuddy lives in the self-hosted Chatwoot instance. The widget is loaded
 * after hydration so it never blocks first paint, and it is only rendered when
 * a website token is configured for the active locale — local builds and
 * previews stay silent.
 *
 * Two website inboxes (EN/FA) provide the localized welcome copy; the same
 * agent bot answers both. The widget token is public by design (it ships in the
 * browser), so it is passed as a server-rendered prop rather than baked in at
 * build time, which lets us rotate tokens without rebuilding the web image.
 */
export function ChatWidget({
  locale,
  baseUrl,
  tokenEn,
  tokenFa,
}: {
  locale: Locale;
  baseUrl?: string;
  tokenEn?: string;
  tokenFa?: string;
}) {
  const token = locale === "fa" ? tokenFa || tokenEn : tokenEn;
  const resolvedBaseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  if (!token) return null;

  const settings: ChatwootSettings = {
    locale,
    position: "right",
    type: "standard",
    launcherTitle: locale === "fa" ? "ترم‌بادی" : "Termbuddy",
    // The widget follows the operating system scheme. The site's own toggle can
    // disagree; the iframe cannot read the class on <html>.
    darkMode: "auto",
    showPopoutButton: false,
    // There are no human agents, so Chatwoot's default presence banner would
    // say "We are away". Termbuddy is always available; say so instead.
    availableMessage: locale === "fa" ? "ترم‌بادی ۲۴ ساعته آنلاین است و فوراً پاسخ می‌دهد." : "Termbuddy is online 24/7 and replies instantly.",
    unavailableMessage: locale === "fa" ? "ترم‌بادی ۲۴ ساعته آنلاین است و فوراً پاسخ می‌دهد." : "Termbuddy is online 24/7 and replies instantly.",
  };

  return (
    <>
      <Script
        id="chatwoot-settings"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: `window.chatwootSettings = ${JSON.stringify(settings)};` }}
      />
      <Script
        id="chatwoot-sdk"
        strategy="afterInteractive"
        src={`${resolvedBaseUrl}/packs/js/sdk.js`}
        onLoad={() => {
          window.chatwootSDK?.run({ websiteToken: token, baseUrl: resolvedBaseUrl });
        }}
      />
    </>
  );
}
