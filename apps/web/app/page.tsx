import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Store,
  Quote,
  ScrollText,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero/hero";
import { ConsoleSearch } from "@/components/sections/console-search";
import { Process } from "@/components/sections/process";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { Magnetic } from "@/components/motion/magnetic";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/product-card";
import { CreatorIdentity } from "@/components/marketplace/product-parts";
import { getMarketplaceHome } from "@/lib/api";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const collections = [
  {
    title: "Tools for careful research",
    copy: "Evidence-first workflows that keep sources, caveats, and reasoning visible.",
    count: 84,
  },
  {
    title: "Ship better software",
    copy: "Review, accessibility, and database tools made by practicing engineers.",
    count: 212,
  },
  {
    title: "Find the words that work",
    copy: "Brand and conversion systems grounded in customer language, not hype.",
    count: 67,
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
    copy: "Commercial use, redistribution and attribution answered before you reach checkout.",
  },
];

export default async function Home() {
  const locale = await getLocale();
  const t = copy[locale];
  const marketplace = await getMarketplaceHome().catch((error) => { console.error("Marketplace home load failed", error); return null; });
  const products = marketplace?.products ?? [];
  const creators = marketplace?.creators ?? [];
  const categories = marketplace?.categories ?? [];
  const featured = products.filter((product) => product.featured);

  return (
    <>
      <Header />
      <main>
        <Hero />
        {!marketplace && <p role="alert" className="border-b border-warning/40 bg-warning/10 px-5 py-3 text-center text-sm">{t.unavailable}</p>}

        {/* --- the console --------------------------------------------------- */}
        <section className="border-b border-border bg-surface/30 py-12">
          <ConsoleSearch />
        </section>

        {/* --- featured ------------------------------------------------------ */}
        <section className="container-page py-20 lg:py-28">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t.featuredEyebrow}</p>
              <h2 className="editorial mt-3 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
                {t.featuredTitle}
              </h2>
            </div>
            <Link
              href={localePath("/explore", locale)}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              {t.viewAll.replace("{count}", String(marketplace?.total ?? 0))}
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 90}>
                <TiltCard className="h-full rounded-lg" max={5}>
                  <ProductCard product={product} variant="expanded" />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --- how it works (pinned narrative) ------------------------------- */}
        <Process />

        {/* --- trust --------------------------------------------------------- */}
        <section className="container-page py-20 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-verified">
                <ShieldCheck size={13} />
                Verified
              </span>
              <h2 className="editorial mt-6 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
                Trust is product information.
              </h2>
              <p className="mt-5 max-w-md leading-8 text-muted-foreground">
                Most catalogues bury what a tool actually does inside a
                paragraph of marketing. We break compatibility, permissions,
                requirements, licence and safety status into separate fields so
                you can judge a product before it touches your workflow.
              </p>
              <blockquote className="editorial mt-8 border-l-2 border-primary/50 pl-5 text-xl leading-8">
                <Quote size={20} className="mb-3 text-primary" />
                A good AI product should tell you what it does, what it touches,
                and why you can trust it.
                <footer className="mt-4 font-sans text-sm not-italic text-muted-foreground">
                  The termspace quality standard
                </footer>
              </blockquote>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {trustFacts.map((fact, index) => {
                const Icon = fact.icon;
                return (
                  <Reveal key={fact.title} delay={index * 90}>
                    <TiltCard
                      className="h-full rounded-xl border border-border bg-surface/70 p-6 backdrop-blur"
                      max={4}
                    >
                      <div className="flex items-start gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                          <Icon size={18} />
                        </span>
                        <div>
                          <h3 className="font-semibold">{fact.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {fact.copy}
                          </p>
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- collections (inverted, plasma-lit) ---------------------------- */}
        <section id="collections" className="relative isolate overflow-hidden border-y border-border bg-background-deep py-20 lg:py-28">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(60% 70% at 12% 0%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 70%), radial-gradient(55% 65% at 88% 100%, color-mix(in oklab, var(--spark) 20%, transparent), transparent 72%)",
            }}
          />
          <div className="container-page">
            <Reveal>
              <p className="eyebrow">{t.collectionsEyebrow}</p>
              <h2 className="editorial mt-3 max-w-2xl text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
                Shelves assembled by people who use this stuff daily.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {collections.map((collection, index) => (
                <Reveal key={collection.title} delay={index * 100}>
                  <Link
                    href="/explore"
                    className="group flex h-full flex-col rounded-xl border border-border bg-surface/50 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-plasma"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <ArrowUpRight
                        size={18}
                        className="text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </div>
                    <h3 className="editorial mt-14 text-2xl leading-tight">
                      {collection.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                      {collection.copy}
                    </p>
                    <p className="mt-6 font-mono text-xs text-accent">
                      {collection.count} listings
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --- browse by practice -------------------------------------------- */}
        <section className="container-page py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <Reveal>
              <p className="eyebrow">{t.practiceEyebrow}</p>
              <h2 className="editorial mt-3 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
                Made for work that matters.
              </h2>
              <p className="mt-5 max-w-sm leading-7 text-muted-foreground">
                Start with the outcome, not the file format.
              </p>
            </Reveal>

            <Reveal
              delay={120}
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3"
            >
              {categories.map((category, index) => (
                <Link
                  href={`${localePath("/explore", locale)}?category=${encodeURIComponent(category.name)}`}
                  key={category.slug}
                  className="group relative min-h-32 bg-background p-5 transition-colors hover:bg-surface"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-9 text-sm font-semibold transition-colors group-hover:text-primary">
                    {category.name}
                  </p>
                  <span
                    aria-hidden
                    className="rule-plasma absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  />
                </Link>
              ))}
            </Reveal>
          </div>
        </section>

        {/* --- creators ------------------------------------------------------ */}
        <section
          id="creators"
          className="border-y border-border bg-surface/40 py-20 lg:py-28"
        >
          <div className="container-page">
            <Reveal>
              <p className="eyebrow">{t.creatorsEyebrow}</p>
              <h2 className="editorial mt-3 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
                {t.featuredCreators}
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {creators.slice(0, 3).map((creator, index) => (
                <Reveal key={creator.id} delay={index * 90}>
                  <TiltCard
                    className="h-full rounded-xl border border-border bg-background/70 p-6"
                    max={4}
                  >
                    <CreatorIdentity creator={creator} />
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {creator.bio}
                    </p>
                    <p className="mt-5 font-mono text-xs text-muted-foreground">
                      {creator.products} products ·{" "}
                      {creator.followers.toLocaleString()} followers
                    </p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>

            <Reveal delay={180} className="mt-12">
              <div className="grid items-center gap-8 rounded-2xl border border-border bg-background/70 p-8 backdrop-blur md:grid-cols-[1.2fr_.8fr] lg:p-10">
                <div>
                  <Store size={26} className="text-primary" />
                  <h3 className="editorial mt-5 text-2xl sm:text-3xl">
                    A serious shelf for your best work.
                  </h3>
                  <p className="mt-3 max-w-lg leading-7 text-muted-foreground">
                    Publish with rich previews, version history, compatibility
                    metadata and a storefront that respects the craft — not a
                    zip file and a hope.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <Magnetic>
                    <Link href={localePath("/design-system", locale)} className={`${buttonVariants({ size: "lg" })} shadow-plasma`}>
                      Read the creator guide
                    </Link>
                  </Magnetic>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --- closing CTA ---------------------------------------------------- */}
        <section className="container-page py-20 lg:py-28">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-2xl border border-border px-6 py-14 sm:px-12">
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
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
