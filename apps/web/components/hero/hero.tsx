import { ConsoleSearch } from "@/components/sections/console-search";
import { copy, type Locale } from "@/lib/i18n";
import { homeSections } from "@/lib/i18n/home-sections";
import type { MarketplaceTypeCount } from "@/lib/types";
import { Datasheet, TitleBlock } from "./datasheet";

/**
 * The landing hero, set as a component datasheet (surface brief for `/`).
 *
 * A server component with no animation: the headline is the LCP element and
 * paints at once, the search is the one interactive part, and the example
 * listing is static markup that shows the product's claim instead of
 * describing it. Copy for the sheet lives in `home-sections.ts`, outside the
 * client dictionary, so it costs the page no JavaScript.
 */
export function Hero({
  locale,
  types,
}: {
  locale: Locale;
  types?: Promise<MarketplaceTypeCount[]>;
}) {
  const t = copy[locale];
  const sheet = homeSections[locale].datasheet;

  return (
    <section className="border-b border-border">
      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:gap-14">
          <div>
            <h1 className="ts-hero-title max-w-4xl text-balance text-[clamp(2.1rem,1rem+3.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.025em]">
              <span className="block">{t.heroStop} {t.heroScratch}</span>
              <span className="block">{t.heroStart}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t.heroIntro}
            </p>
          </div>
          <div className="hidden lg:block">
            <TitleBlock sheet={sheet} />
          </div>
        </div>

        <div className="mt-8">
          <ConsoleSearch
            variant="hero"
            types={types}
            label={sheet.findLabel}
            browseLabel={sheet.browseLabel}
          />
        </div>

        <Datasheet sheet={sheet} />
      </div>
    </section>
  );
}
