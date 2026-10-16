import type { Metadata } from "next";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Per-page canonical and hreflang. Next merges `alternates` shallowly, so the
 * root layout must not set a canonical: every page without its own would
 * inherit the home page's. English is the `x-default`.
 */
export function pageAlternates(path: string, locale: Locale): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(path, locale),
    languages: { en: localePath(path, "en"), fa: localePath(path, "fa"), "x-default": localePath(path, "en") },
  };
}
