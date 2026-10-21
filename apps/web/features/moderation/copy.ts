import { useLocale } from "@/lib/locale-context";
import { moderation } from "@/lib/i18n/moderation";

/**
 * The moderation copy is not part of the global `copy` dictionary: that object
 * is imported by client components on every page, and these strings are only
 * ever read on the moderation screens.
 */
export function useModerationCopy() {
  const { locale } = useLocale();
  return moderation[locale].moderation;
}
