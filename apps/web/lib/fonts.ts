/**
 * Self-hosted variable fonts (SIL OFL; licences in public/fonts). The
 * @font-face rules, with metric-matched fallbacks so the swap does not shift
 * layout, are in styles/globals.css; this is the list the root layout
 * preloads.
 *
 * Not next/font: the production build runs on webpack, whose next/font
 * integration in Next 16 records no preloads for this app (its font
 * manifest comes out empty), and next/font preloads per layout rather than
 * per locale. File names carry the package version, so they are cached
 * immutably (next.config.ts).
 */

const FONT_DIR = "/fonts";

const NEWSREADER = `${FONT_DIR}/newsreader-latin-wght-v5.3.0.woff2`;
const GEIST = `${FONT_DIR}/geist-latin-wght-v5.3.0.woff2`;
const ESTEDAD = `${FONT_DIR}/estedad-arabic-wght-v5.3.0.woff2`;

/**
 * What each locale's first paint needs. English: the headline serif (the
 * LCP element) and the body sans. Persian sets its headline and body in
 * Estedad, and keeps Geist for the Latin inside it.
 */
export function preloadedFonts(locale: string): readonly string[] {
  return locale === "fa" ? [ESTEDAD, GEIST] : [NEWSREADER, GEIST];
}
