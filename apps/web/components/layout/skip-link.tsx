import type { Locale } from "@/lib/i18n";

/** First stop for keyboard and screen-reader users; visible only while focused. */
export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:outline focus:outline-2 focus:outline-primary"
    >
      {locale === "fa" ? "رفتن به محتوا" : "Skip to content"}
    </a>
  );
}
