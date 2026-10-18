import { ConsoleSearch } from "@/components/sections/console-search";
import { copy, type Locale } from "@/lib/i18n";
import { homeSections } from "@/lib/i18n/home-sections";
import type { MarketplaceTypeCount } from "@/lib/types";

/**
 * The landing hero: headline, search, and whatever shelf the page slots in
 * underneath (the featured listings), sized to share the first screen.
 *
 * A server component with no animation: the headline is the LCP element and
 * paints at once, and the search is the one interactive part. Search labels
 * live in `home-sections.ts`, outside the client dictionary, so they cost the
 * page no JavaScript.
 */
export function Hero({
  locale,
  types,
  children,
}: {
  locale: Locale;
  types?: Promise<MarketplaceTypeCount[]>;
  children?: React.ReactNode;
}) {
  const t = copy[locale];
  const sheet = homeSections[locale].datasheet;

  return (
    <section className="border-b border-border">
      <div className="container-page py-6 lg:py-8">
        <div>
          <div className="text-center">
            <h1 className="editorial mx-auto max-w-4xl text-balance text-4xl leading-[1.1] sm:text-5xl">
              <span className="block">{t.heroStop} {t.heroScratch}</span>
              <span className="block">{t.heroStart}</span>
            </h1>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-3xl">
          <ConsoleSearch
            variant="hero"
            types={types}
            browseLabel={sheet.browseLabel}
          />
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
