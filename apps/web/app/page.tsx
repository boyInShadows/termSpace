import { Suspense, cache } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Store,
  Quote,
  ScrollText,
  PackageOpen,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero/hero";
import { Process } from "@/components/sections/process";
import { Browse, type BrowseCollection } from "@/components/sections/browse";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/marketplace/product-card";
import { CreatorIdentity } from "@/components/marketplace/product-parts";
import { SectionNotice } from "@/components/patterns/section-notice";
import { SectionEmpty } from "@/components/patterns/section-empty";
import {
  CategoryGridSkeleton,
  CreatorGridSkeleton,
  ProductGridSkeleton,
} from "@/components/patterns/skeleton";
import { getMarketplaceHome } from "@/lib/api";
import { mockHome } from "@/lib/mock-home";
import type { MarketplaceHome } from "@/lib/types";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * One fetch, shared by every section.
 *
 * `cache()` dedupes across the render pass, so each section can `await` the
 * catalogue independently — and therefore stream in behind its own skeleton —
 * without turning one request into four.
 *
 * The homepage never throws on a failed catalogue. A landing page that 500s
 * because a list of nine categories is unavailable is a worse outcome than one
 * that says so and keeps its search box working, so the failure degrades to
 * the local fixture with a visible notice scoped to the affected section.
 */
const loadHome = cache(
  async (): Promise<{ home: MarketplaceHome; degraded: boolean }> => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "1") {
      return { home: mockHome, degraded: false };
    }
    try {
      return { home: await getMarketplaceHome(), degraded: false };
    } catch (error) {
      console.error("Marketplace home load failed", error);
      return { home: mockHome, degraded: true };
    }
  },
);

/**
 * Editorial shelves, each backed by exactly one real category.
 *
 * The counts used to be hardcoded (84 / 212 / 67) beside a Featured section
 * that could simultaneously report zero listings. Reading them from the same
 * response as everything else makes that disagreement impossible, and a
 * missing category yields no count rather than a confident zero.
 */
const COLLECTION_SHELVES = [
  {
    title: "Tools for careful research",
    copy: "Evidence-first workflows that keep sources, caveats, and reasoning visible.",
    category: "Research",
  },
  {
    title: "Ship better software",
    copy: "Review, accessibility, and database tools made by practicing engineers.",
    category: "Engineering",
  },
  {
    title: "Find the words that work",
    copy: "Brand and conversion systems grounded in customer language, not hype.",
    category: "Marketing",
  },
];

const trustFacts = [
  {
    icon: FileCheck2,
    title: "Human-readable permissions",
    copy: "Every listing states what it reads, writes and calls out to — in a sentence, not a config file.",
  },
  {
    icon: RefreshCw,
    title: "Visible update history",
    copy: "Every version, with notes from the person who shipped it. Pin the one you inspected.",
  },
  {
    icon: ScrollText,
    title: "Licence on the label",
    copy: "Use, redistribution and attribution are clear before you install anything.",
  },
];

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
  const { home } = await loadHome();
  // "View all 0 listings" is worse than no link at all: it asserts an empty
  // catalogue, which is never what an unreachable one means.
  if (home.total <= 0) return null;
  return (
    <Link
      href={localePath("/explore", locale)}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
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
  const { home, degraded } = await loadHome();
  const featured = home.products.filter((product) => product.featured);

  return (
    <>
      {degraded && <SectionNotice className="mb-6" />}
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
        <div className="grid gap-5 md:grid-cols-3">
          {featured.slice(0, 3).map((product) => (
            <div key={product.id} className="ts-reveal">
              <div className="ts-lift h-full rounded-lg">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* --- browse (collections + practice) ------------------------------------- */

async function BrowsePanels({ locale }: { locale: Locale }) {
  const { home } = await loadHome();

  const collections: BrowseCollection[] = COLLECTION_SHELVES.map((shelf) => ({
    ...shelf,
    count:
      home.categories.find((category) => category.name === shelf.category)
        ?.products ?? null,
  }));

  return (
    <Browse
      collections={collections}
      categories={home.categories}
      exploreHref={localePath("/explore", locale)}
    />
  );
}

/* --- creators ------------------------------------------------------------ */

async function CreatorGrid({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { home } = await loadHome();

  if (home.creators.length === 0) {
    return (
      <SectionEmpty
        icon={Users}
        title={t.homePage.emptyCreatorsTitle}
        body={t.homePage.emptyCreatorsBody}
        action={{
          label: t.homePage.emptyCreatorsCta,
          href: localePath("/creator", locale),
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {home.creators.slice(0, 3).map((creator) => (
        <div key={creator.id} className="ts-reveal">
          <div className="ts-lift h-full rounded-xl border border-border bg-background/70 p-6">
            <CreatorIdentity creator={creator} />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {creator.bio}
            </p>
            <p className="mt-5 font-mono text-xs text-muted-foreground">
              {t.homePage.creatorStats
                .replace("{products}", formatNumber(creator.products, locale))
                .replace("{followers}", formatNumber(creator.followers, locale))}
            </p>
          </div>
        </div>
      ))}

      {/* The creator pitch as the row's last tile rather than its own section.
          It is the same invitation the three profiles beside it already make,
          so it belongs in the same breath. */}
      <div className="ts-reveal">
        <div className="flex h-full flex-col rounded-xl border border-primary/40 bg-primary-soft/40 p-6 backdrop-blur">
          <Store size={22} className="text-primary" />
          <h3 className="editorial mt-4 text-xl leading-tight">
            {t.homePage.creatorCtaTitle}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
            {t.homePage.creatorCtaBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={localePath("/dashboard", locale)}
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "shadow-plasma",
              )}
            >
              {t.homePage.creatorCtaPrimary}
            </Link>
            <Link
              href={localePath("/design-system", locale)}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {t.homePage.creatorCtaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- page ---------------------------------------------------------------- */

export default async function Home() {
  const locale = await getLocale();
  const t = copy[locale];

  return (
    <>
      <Header />
      <main>
        {/* A promise, not awaited: the hero is the page shell and must not
            wait on the catalogue. The chips render at once and their counts
            stream in behind their own boundary. */}
        <Hero types={loadHome().then((result) => result.home.types)} />

        {/* --- featured ------------------------------------------------------ */}
        <section className="container-page section-y">
          <div className="ts-reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t.featuredEyebrow}</p>
              <h2 className={SECTION_HEADING}>{t.featuredTitle}</h2>
            </div>
            <Suspense fallback={null}>
              <FeaturedLink locale={locale} />
            </Suspense>
          </div>

          <div className="mt-10">
            <Suspense
              fallback={<ProductGridSkeleton label={t.homePage.loadingFeatured} />}
            >
              <FeaturedGrid locale={locale} />
            </Suspense>
          </div>
        </section>

        {/* --- how it works (pinned narrative) ------------------------------- */}
        <Process />

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
            <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
              <div className="ts-reveal">
                <span className="inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-verified">
                  <ShieldCheck size={13} />
                  Verified
                </span>
                <h2 className={SECTION_HEADING}>
                  Trust is product information.
                </h2>
                <p className="mt-5 max-w-md leading-8 text-muted-foreground">
                  Most catalogues bury what a tool actually does inside a
                  paragraph of marketing. We break compatibility, permissions,
                  requirements, licence and safety status into separate fields
                  so you can judge a product before it touches your workflow.
                </p>
                <blockquote className="editorial mt-8 border-s-2 border-primary/50 ps-5 text-xl leading-8">
                  <Quote size={20} className="mb-3 text-primary" />
                  A good AI product should tell you what it does, what it
                  touches, and why you can trust it.
                  <footer className="mt-4 font-sans text-sm not-italic text-muted-foreground">
                    <Link
                      href={localePath("/design-system", locale)}
                      className="transition-colors hover:text-primary"
                    >
                      The termspace quality standard
                    </Link>
                  </footer>
                </blockquote>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {trustFacts.map((fact, index) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.title} className="ts-reveal">
                      <div className="ts-lift h-full rounded-xl border border-border bg-surface/70 p-6 backdrop-blur">
                        <div className="flex items-start gap-4">
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

        {/* --- browse: collections + by practice, one section ----------------- */}
        <section id="collections" className="container-page section-y">
          <div className="ts-reveal">
            <p className="eyebrow">{t.homePage.browseEyebrow}</p>
            <h2 className={`${SECTION_HEADING} max-w-2xl`}>
              {t.homePage.browseTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              {t.homePage.browseIntro}
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mt-10">
                <CategoryGridSkeleton label={t.homePage.loadingPractice} />
              </div>
            }
          >
            <BrowsePanels locale={locale} />
          </Suspense>
        </section>

        {/* --- creators + the creator invitation ------------------------------ */}
        <section
          id="creators"
          className="border-y border-border bg-surface/40"
        >
          <div className="container-page section-y">
            <div className="ts-reveal">
              <p className="eyebrow">{t.creatorsEyebrow}</p>
              <h2 className={SECTION_HEADING}>{t.featuredCreators}</h2>
            </div>

            <div className="mt-10">
              <Suspense
                fallback={
                  <CreatorGridSkeleton label={t.homePage.loadingCreators} />
                }
              >
                <CreatorGrid locale={locale} />
              </Suspense>
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
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <p className="eyebrow">{t.inboxEyebrow}</p>
                  <h2 className="editorial mt-3 text-[clamp(1.9rem,1.2rem+2vw,2.9rem)] leading-[1.05]">
                    {t.inboxTitle}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                    What shipped, what got reviewed, and what is worth your
                    attention. No launch announcements.
                  </p>
                </div>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
