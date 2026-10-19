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
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero/hero";
import { Process } from "@/components/sections/process";
import { cn } from "@/lib/utils";
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

/**
 * A distinct tint per trust card, so the three scan as three different
 * guarantees rather than one repeated in three boxes.
 *
 * Purple, cyan, green — not the purple/green/amber a straight reading would
 * suggest. `--warning` is the caution colour and using it to decorate a
 * reassurance inverts its meaning. `--verified` is under a semantic lock in
 * styles/tokens.css ("if it is green, it is a trust claim"), and all three of
 * these are trust claims, so it is within its own rule here.
 */
const TRUST_TINTS = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent",
  "bg-verified/15 text-verified",
];

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
        <div className="grid gap-4 md:grid-cols-3">
          {featured.slice(0, 3).map((product) => (
            <div key={product.id} className="ts-reveal">
              <div className="ts-lift h-full rounded-lg">
                <CompactProductCard product={product} />
              </div>
            </div>
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
      <Header />
      <main>
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

        {/* --- trust, inverted ----------------------------------------------
            The one full-bleed dark section on the page. Every other section is
            a light-on-background grid, and the argument this one makes is the
            product's central claim, so it gets a different ground to stand on
            rather than being the fifth identical band in a row. */}
        <section className="relative isolate overflow-hidden border-y border-border bg-background-deep">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              opacity: "var(--nebula-opacity)",
              backgroundImage:
                "radial-gradient(60% 70% at 12% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%), radial-gradient(55% 65% at 88% 100%, color-mix(in oklab, var(--spark) 16%, transparent), transparent 72%)",
            }}
          />
          <div className="container-page section-y">
            <div className="grid gap-12">
              <div className="ts-reveal mx-auto flex max-w-2xl flex-col items-center text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-verified">
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
                      href={localePath("/design-system", locale)}
                      className="-my-1.5 inline-block py-1.5 transition-colors hover:text-primary"
                    >
                      {sections.trustQuoteLink}
                    </Link>
                  </footer>
                </blockquote>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {sections.trustFacts.map((fact, index) => {
                  const Icon = TRUST_ICONS[index];
                  return (
                    <div key={fact.title} className="ts-reveal">
                      <div className="ts-lift h-full rounded-xl border border-border bg-surface/70 p-6 backdrop-blur">
                        <div className="flex flex-col items-center gap-4 text-center">
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-lg",
                              TRUST_TINTS[index],
                            )}
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
          <div className="ts-reveal">
            <div className="relative isolate overflow-hidden rounded-2xl border border-border px-6 py-12 sm:px-12">
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                  backgroundImage:
                    "linear-gradient(115deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--spark) 16%, transparent) 48%, color-mix(in oklab, var(--accent) 14%, transparent))",
                }}
              />
              <div className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center">
                <div>
                  <p className="eyebrow">{t.inboxEyebrow}</p>
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
