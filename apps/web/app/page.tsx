import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Quote,
  ScrollText,
  PackageOpen,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero/hero";
import { Process } from "@/components/sections/process";
import { CompactProductCard } from "@/components/marketplace/compact-product-card";
import { SectionNotice } from "@/components/patterns/section-notice";
import { SectionEmpty } from "@/components/patterns/section-empty";
import { ProductGridSkeleton } from "@/components/patterns/skeleton";
import { getMarketplaceHome } from "@/lib/api";
import { mockHome } from "@/lib/mock-home";
import type { MarketplaceHome } from "@/lib/types";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { pageAlternates } from "@/lib/alternates";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { homeSections } from "@/lib/i18n/home-sections";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * One fetch, shared by every section.
 *
 * `cache()` dedupes across the render pass, so each section can `await` the
 * catalogue independently — and therefore stream in behind its own skeleton —
 * without duplicating the request.
 *
 * The homepage never throws on a failed catalogue. A landing page that 500s
 * because a list of nine categories is unavailable is a worse outcome than one
 * that says so and keeps its search box working, so a failure shows Retry
 * instead of sample listings that may not exist in the real catalogue.
 */
const loadHome = cache(
  async (): Promise<MarketplaceHome | null> => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "1") {
      return mockHome;
    }
    try {
      return await getMarketplaceHome();
    } catch (error) {
      console.error("Marketplace home load failed", error);
      return null;
    }
  },
);

const TRUST_ICONS = [FileCheck2, RefreshCw, ScrollText] as const;

const SECTION_HEADING =
  "editorial mt-3 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]";

/* --- featured ------------------------------------------------------------ */

async function FeaturedLink({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const home = await loadHome();
  // "View all 0 listings" is worse than no link at all: it asserts an empty
  // catalogue, which is never what an unreachable one means.
  if (!home || home.total <= 0) return null;
  return (
    <Link
      href={localePath("/explore", locale)}
      className="group -my-1.5 inline-flex items-center gap-1.5 py-1.5 text-sm font-semibold text-primary"
    >
      {t.viewAll.replace("{count}", formatNumber(home.total, locale))}
      <ArrowRight
        size={15}
        className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
      />
    </Link>
  );
}

async function FeaturedGrid({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const home = await loadHome();
  if (!home) return <SectionNotice />;
  const featured = home.products.filter((product) => product.featured);

  return (
    <>
      {featured.length === 0 ? (
        <SectionEmpty
          icon={PackageOpen}
          title={t.homePage.emptyFeaturedTitle}
          body={t.homePage.emptyFeaturedBody}
          action={{
            label: t.homePage.emptyFeaturedCta,
            href: localePath("/explore", locale),
          }}
        />
      ) : (
        <div className="grid gap-px bg-border md:grid-cols-3">
          {featured.slice(0, 3).map((product) => (
            <CompactProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

/* --- page ---------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: pageAlternates("/", await getLocale()) };
}

export default async function Home() {
  const locale = await getLocale();
  const t = copy[locale];
  const sections = homeSections[locale];

  return (
    <>
      <main id="content" tabIndex={-1}>
        {/* A promise, not awaited: the hero is the page shell and must not
            wait on the catalogue. The chips render at once and their counts
            stream in behind their own boundary. */}
        <Hero locale={locale} types={loadHome().then((home) => home?.types ?? [])}>
          {/* The featured shelf lives in the hero, directly under the search,
              so the first screen shows both how to look and what to find. */}
          <section aria-labelledby="featured-heading">
            <h2
              id="featured-heading"
              className="editorial text-center text-[clamp(1.35rem,1.1rem+0.8vw,1.75rem)] leading-tight"
            >
              {t.featuredTitle}
            </h2>

            <div className="mt-4 fit:mt-[clamp(0.5rem,6svh_-_1.75rem,1.75rem)]">
              <Suspense
                fallback={
                  <ProductGridSkeleton label={t.homePage.loadingFeatured} compact />
                }
              >
                <FeaturedGrid locale={locale} />
              </Suspense>
            </div>
            <div className="mt-2 flex justify-center">
              <Suspense fallback={null}>
                <FeaturedLink locale={locale} />
              </Suspense>
            </div>
          </section>
        </Hero>

        {/* --- how it works (pinned narrative) ------------------------------- */}
        <Process copy={sections} />

        <section className="border-y border-foreground/60 bg-background">
          <div className="container-page section-y">
            <div className="grid gap-12">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck size={13} />
                  {sections.trustBadge}
                </span>
                <h2 className={SECTION_HEADING}>{t.trustEyebrow}</h2>
                <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
                  {sections.trustBody}
                </p>
                <blockquote className="editorial mt-8 text-xl leading-8">
                  <Quote size={20} className="mx-auto mb-3 text-primary" />
                  {sections.trustQuote}
                  <footer className="mt-4 font-sans text-sm not-italic text-muted-foreground">
                    <Link
                      href={localePath("/content-policy", locale)}
                      className="-my-1.5 inline-block py-1.5 transition-colors hover:text-primary"
                    >
                      {sections.trustQuoteLink}
                    </Link>
                  </footer>
                </blockquote>
              </div>

              <div className="grid gap-px bg-border md:grid-cols-3">
                {sections.trustFacts.map((fact, index) => {
                  const Icon = TRUST_ICONS[index];
                  return (
                    <div key={fact.title} className="h-full bg-background">
                      <div className="h-full bg-background p-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                          <span
                            className="grid size-10 shrink-0 place-items-center border border-border text-muted-foreground"
                          >
                            <Icon size={18} />
                          </span>
                          <div>
                            <h3 className="font-semibold">{fact.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {fact.copy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* --- closing CTA --------------------------------------------------- */}
        <section className="container-page section-y">
          <div className="h-full bg-background">
            <div className="border-y border-foreground/60 px-6 py-12 sm:px-12">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center">
                <div>
                  <h2 className="editorial mt-3 text-[clamp(1.9rem,1.2rem+2vw,2.9rem)] leading-[1.05]">
                    {t.inboxTitle}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                    {sections.inboxBody}
                  </p>
                </div>
                <div className="w-full text-start">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
