import type { Locale } from "./i18n";

/**
 * The numerals policy, decided here once, not per call.
 *
 * - `prose`: a number read as part of a sentence ("۲ بررسی جدید", "9.4k uses")
 *   uses the reader's digits, so Persian gets Persian digits.
 * - `data`: versions, counts in tables, commands, timestamps and prices stay
 *   in Latin digits in every locale, so "v2.4.0 · 12 versions" reads the same
 *   everywhere. Render data inside a `dir="ltr"` element so it never flips.
 */
export type NumberContext = "prose" | "data";

type FormatOptions = Intl.NumberFormatOptions & { context?: NumberContext; compact?: boolean };

export function formatNumber(value: number, locale: Locale, { context = "prose", compact = false, ...options }: FormatOptions = {}): string {
  const tag = locale === "fa" && context === "prose" ? "fa-IR" : "en-US";
  return new Intl.NumberFormat(tag, compact ? { notation: "compact", maximumFractionDigits: 1, ...options } : options).format(value);
}
