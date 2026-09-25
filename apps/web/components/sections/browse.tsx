"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { SectionEmpty } from "@/components/patterns/section-empty";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export type BrowseCollection = {
  title: string;
  copy: string;
  /** Category this shelf filters to. Also where its count comes from. */
  category: string;
  /** Null when the catalogue has no such category, rather than a wrong zero. */
  count: number | null;
};

export type BrowseCategory = { name: string; slug: string };

const TABS = ["collections", "practice"] as const;
type Tab = (typeof TABS)[number];

/**
 * Curated collections and the flat practice grid, as two tabs of one section.
 *
 * They were two full-height sections in a row asking the same question —
 * "where do you want to start?" — with the same eyebrow/headline/grid shape,
 * which is most of why the page read as nine variations of one layout.
 *
 * The active tab lives in the URL (`?browse=`) rather than in component state,
 * per the project's state rules: it is shareable view state, so a link to the
 * practice grid should open on the practice grid.
 */
export function Browse({
  collections,
  categories,
  exploreHref,
}: {
  collections: BrowseCollection[];
  categories: BrowseCategory[];
  exploreHref: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const requested = searchParams.get("browse");
  const active: Tab = requested === "practice" ? "practice" : "collections";

  const select = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "collections") params.delete("browse");
      else params.set("browse", tab);
      const query = params.toString();
      // `scroll: false` — the section the reader is looking at must not jump
      // to the top of the document just because they changed a tab.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // Roving focus: Left/Right move between tabs, Home/End jump to the ends.
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    let next = -1;
    if (event.key in offsets) {
      next = (index + offsets[event.key] + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = TABS.length - 1;
    }
    if (next === -1) return;
    event.preventDefault();
    select(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label={t.homePage.browseTitle}
        className="mt-7 inline-flex gap-1 rounded-full border border-border bg-surface/60 p-1"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`browse-tab-${tab}`}
            aria-selected={active === tab}
            aria-controls={`browse-panel-${tab}`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => select(tab)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "min-h-9 rounded-full px-4 text-sm font-semibold transition",
              active === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "collections"
              ? t.homePage.tabCollections
              : t.homePage.tabPractice}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="browse-panel-collections"
        aria-labelledby="browse-tab-collections"
        hidden={active !== "collections"}
        /* Below md these are a snap-scrolling row rather than a stack: three
           full-width cards make the reader scroll past the whole section to
           reach the next one, and the negative margin lets the row bleed to
           the screen edge so the third card is visibly cut off and therefore
           visibly reachable. */
        className="mt-10 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {collections.map((collection, index) => (
          <Link
            key={collection.title}
            href={`${exploreHref}?category=${encodeURIComponent(collection.category)}`}
            className="group flex h-full w-[78vw] shrink-0 snap-start flex-col rounded-xl border border-border bg-surface/50 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-plasma sm:w-[60vw] md:w-auto md:shrink"
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <ArrowUpRight
                size={18}
                className="text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              />
            </div>
            <h3 className="editorial mt-10 text-2xl leading-tight">
              {collection.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {collection.copy}
            </p>
            {collection.count !== null && (
              <p className="mt-6 font-mono text-xs text-accent">
                {t.homePage.listingCount.replace(
                  "{count}",
                  String(collection.count),
                )}
              </p>
            )}
          </Link>
        ))}
      </div>

      <div
        role="tabpanel"
        id="browse-panel-practice"
        aria-labelledby="browse-tab-practice"
        hidden={active !== "practice"}
        className="mt-10"
      >
        {categories.length === 0 ? (
          <SectionEmpty
            icon={LayoutGrid}
            title={t.homePage.emptyPracticeTitle}
            body={t.homePage.emptyPracticeBody}
          />
        ) : (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                href={`${exploreHref}?category=${encodeURIComponent(category.name)}`}
                className="group relative min-h-28 bg-background p-5 transition-colors hover:bg-surface"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-7 text-sm font-semibold transition-colors group-hover:text-primary">
                  {category.name}
                </p>
                <span
                  aria-hidden
                  className="rule-plasma absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
