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
    // From tablet up the hero fills the screen under the header (`fit` and
    // `--header-chrome` live in globals.css). Whatever height the content
    // leaves free is shared out by the spacers: the gaps between blocks grow
    // up to their caps, the rest goes above and below. A min-height, not a
    // height, so content that still cannot fit pushes the fold down instead
    // of overlapping the header or the next section.
    <section className="border-b border-border fit:flex fit:min-h-[calc(100svh-var(--header-chrome))] fit:flex-col">
      <div className="container-page py-6 lg:py-8 fit:flex fit:flex-1 fit:flex-col fit:py-3">
        <Spacer />
        <div className="text-center">
          <h1 className="editorial mx-auto max-w-4xl text-balance text-4xl leading-[1.1] sm:text-5xl fit:text-[clamp(1.875rem,5.5svh,3rem)]">
            <span className="block">{t.heroStop} {t.heroScratch}</span>
            <span className="block">{t.heroStart}</span>
          </h1>
        </div>

        <Spacer max="fit:max-h-12" />
        <div className="mx-auto mt-5 w-full max-w-3xl fit:mt-0">
          <ConsoleSearch
            variant="hero"
            types={types}
            browseLabel={sheet.browseLabel}
          />
        </div>

        {children && (
          <>
            <Spacer max="fit:max-h-20" />
            <div className="mt-6 fit:mt-0">{children}</div>
          </>
        )}
        <Spacer />
      </div>
    </section>
  );
}

/**
 * A gap that grows into free height, up to `max` when given. Gaps between
 * blocks start at 0.75rem; the outer two start at 0, the padding is their floor.
 */
function Spacer({ max }: { max?: string }) {
  return (
    <div
      aria-hidden
      className={`hidden fit:block fit:shrink-0 fit:grow ${max ? `fit:basis-3 ${max}` : "fit:basis-0"}`}
    />
  );
}
