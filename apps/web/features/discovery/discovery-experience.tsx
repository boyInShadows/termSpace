"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import type { MarketplaceCategory, MarketplaceCommunity, MarketplaceItemType, MarketplacePlatform, ProductFilters, ProductPageResult } from "@/lib/types";
import { ProductCard } from "@/components/marketplace/product-card";
import { ProductCardSkeleton } from "@/components/patterns/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { discoveryHref } from "@/lib/discovery-url";

/** Typing settles for this long before the URL, and so the results, change. */
const QUERY_DEBOUNCE_MS = 300;

/**
 * Search and filter a page of listings. The URL is the state: every control
 * rewrites it, the server page fetches the results it describes, and this
 * component renders what it is given. So a view survives a reload, can be
 * linked, and has a real page 2.
 */
export function DiscoveryExperience({ initial, initialError = false, categories, platforms, communities, itemTypes, initialFilters, context }: {
  initial: ProductPageResult;
  initialError?: boolean;
  categories: MarketplaceCategory[];
  platforms: MarketplacePlatform[];
  communities: MarketplaceCommunity[];
  itemTypes: MarketplaceItemType[];
  initialFilters: ProductFilters;
  context?: { eyebrow: string; title: string; intro: string; rules?: string; archived?: boolean };
}) {
  const { fa, t } = useLocale();
  const d = t.discovery;
  const router = useRouter();
  const pathname = usePathname() ?? "/explore";
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const urlQuery = initialFilters.q ?? "";
  // The field is the one control that is not the URL, so typing stays
  // instant. It follows the URL when the URL changes under it (back button).
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }
  const type = initialFilters.type ?? "All";
  const category = initialFilters.category ?? "All";
  const community = initialFilters.community ?? "All";
  const platform = initialFilters.platform ?? "All";
  const verified = initialFilters.verified ?? false;
  const minRating = initialFilters.minRating ?? 0;
  const sort = initialFilters.sort ?? "featured";
  const [view, setView] = useState<"grid" | "list">("grid");
  const result = initial.data;
  const meta = initial.meta;
  const error = initialError ? d.connectionError : null;
  const loading = pending;
  const typeOptions = [{ value: "All", label: d.all }, ...itemTypes.map((item) => ({ value: item.key, label: fa ? item.fa : item.en }))];
  const selectedTypeLabel = typeOptions.find((option) => option.value === type)?.label ?? type;
  const selectedCommunity = communities.find((item) => item.slug === community);
  const selectedCommunityLabel = selectedCommunity ? (fa ? selectedCommunity.nameFa ?? selectedCommunity.nameEn : selectedCommunity.nameEn) : community;
  const selectedCategoryLabel = categories.find((item) => item.slug === category)?.name ?? category;
  const selectedPlatform = platforms.find((item) => item.key === platform);
  const selectedPlatformLabel = selectedPlatform ? (fa ? selectedPlatform.nameFa ?? selectedPlatform.nameEn : selectedPlatform.nameEn) : platform;
  const update = (changes: Record<string, string | number | boolean | undefined>) => {
    const href = discoveryHref(pathname, searchParams?.toString() ?? "", changes);
    startTransition(() => router.replace(href, { scroll: false }));
  };
  useEffect(() => {
    if (query.trim() === urlQuery.trim()) return;
    const timer = window.setTimeout(() => {
      const href = discoveryHref(pathname, searchParams?.toString() ?? "", { q: query.trim() });
      startTransition(() => router.replace(href, { scroll: false }));
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery, pathname, searchParams, router]);
  const change = (key: string) => (value: string) => update({ [key]: value });
  const reset = () => {
    setQuery("");
    // A community page's community is its route, not a filter.
    update({ q: undefined, type: undefined, category: undefined, community: context ? undefined : "All", platform: undefined, verified: undefined, minRating: undefined });
  };
  const retry = () => startTransition(() => router.refresh());
  const pageHref = (page: number) => discoveryHref(pathname, searchParams?.toString() ?? "", { page });
  const active = [
    type !== "All" && selectedTypeLabel,
    category !== "All" && selectedCategoryLabel,
    community !== "All" && selectedCommunityLabel,
    platform !== "All" && selectedPlatformLabel,
    verified && "Verified",
    minRating > 0 && `${minRating}+ ${d.rating}`,
  ].filter(Boolean) as string[];
  const filters = (
    <div className="space-y-7">
      <label className="block text-sm font-semibold">
        {d.category}
        <select value={category} onChange={(event) => change("category")(event.target.value)} className="mt-3 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="All">{d.all}</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      {!context && <label className="block text-sm font-semibold">
        {fa ? "جامعه" : "Community"}
        <select
          value={community}
          onChange={(event) => change("community")(event.target.value)}
          className="mt-3 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="All">{d.all}</option>
          {communities.map((item) => <option key={item.slug} value={item.slug}>{fa ? item.nameFa ?? item.nameEn : item.nameEn}</option>)}
        </select>
        <Link href="/communities" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">{fa ? "مشاهدهٔ همهٔ جامعه‌ها" : "Browse all communities"}</Link>
      </label>}
      <label className="block text-sm font-semibold">
        {d.compatibility}
        <select value={platform} onChange={(event) => change("platform")(event.target.value)} className="mt-3 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="All">{d.all}</option>
          {platforms.map((item) => <option key={item.key} value={item.key}>{fa ? item.nameFa ?? item.nameEn : item.nameEn}</option>)}
        </select>
      </label>
      <FilterGroup
        label={d.rating}
        options={["Any", "4.5+", "4.8+"]}
        value={minRating === 0 ? "Any" : `${minRating}+`}
        setValue={(v) => update({ minRating: v === "Any" ? 0 : parseFloat(v) })}
      />
      <div className="flex items-center justify-between">
        <label htmlFor="verified" className="text-sm font-medium">
          {d.verifiedOnly}
        </label>
        <Switch.Root
          id="verified"
          checked={verified}
          onCheckedChange={(value) => update({ verified: value })}
          className="h-6 w-11 rounded-full bg-border-strong p-0.5 data-[state=checked]:bg-primary"
        >
          <Switch.Thumb className="block size-5 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-5" />
        </Switch.Root>
      </div>
    </div>
  );
  return (
    <main className="container-page py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">{context?.eyebrow ?? d.marketplace}</p>
        <h1 className="editorial mt-2 text-5xl">{context?.title ?? d.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {context?.intro ?? d.intro}
        </p>
        {context?.rules && <p className="mt-4 rounded-lg border bg-surface p-4 text-sm leading-6"><strong>{fa ? "قوانین:" : "Rules:"}</strong> {context.rules}</p>}
        {context?.archived && <p role="status" className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">{fa ? "این جامعه بایگانی شده و فهرست‌های آن در نتایج عمومی نمایش داده نمی‌شوند." : "This community is archived, so its placements are not shown in public discovery."}</p>}
      </div>
      <div className="relative mt-8 max-w-4xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={d.search}
          className="h-14 pl-12 text-base"
        />
      </div>
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label={d.productType}
      >
        {typeOptions.map((option) => (
          <button
            role="tab"
            aria-selected={type === option.value}
            key={option.value}
            onClick={() => update({ type: option.value })}
            className={cn(
              "min-h-10 shrink-0 border-b-2 px-3 text-sm font-medium",
              type === option.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block">
          <div className="flex items-center gap-2 border-b pb-4 font-semibold">
            <SlidersHorizontal size={17} />
            {d.filters}
          </div>
          <div className="mt-6">
            {filters}
          </div>
        </aside>
        <section aria-busy={loading}>
          {/* Sticky, so the count and the controls stay in reach while
              scrolling a page of results. At the very top: the site header
              scrolls away with the page. */}
          <div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-2 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <p className="font-mono text-sm" role="status">
                <strong>{meta.total}</strong> {d.products}
              </p>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="secondary" size="sm" className="lg:hidden">
                    <Filter size={15} /> {d.filters}{" "}
                    {active.length > 0 && `(${active.length})`}
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                  <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(90vw,24rem)] overflow-y-auto bg-background p-6 shadow-lift">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="editorial text-2xl">
                        {d.filters}
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.close}
                        >
                          <X />
                        </Button>
                      </Dialog.Close>
                    </div>
                    <div className="mt-7">
                      {filters}
                    </div>
                    <Dialog.Close asChild>
                      <Button className="mt-8 w-full">
                        {d.showResults.replace("{count}", String(meta.total))}
                      </Button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
            <div className="flex gap-2">
              <select
                aria-label={d.sort}
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="min-h-10 rounded-md border bg-surface px-3 text-sm"
              >
                <option value="featured">{d.featured}</option>
                <option value="rating">{d.topRated}</option>
                <option value="newest">{d.recentlyUpdated}</option>
              </select>
              <div className="flex rounded-md border bg-surface p-0.5">
                <button
                  aria-label={d.gridView}
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={cn(
                    "size-9 rounded",
                    view === "grid" && "bg-muted",
                  )}
                >
                  <Grid2X2 size={16} className="mx-auto" />
                </button>
                <button
                  aria-label={d.listView}
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={cn(
                    "size-9 rounded",
                    view === "list" && "bg-muted",
                  )}
                >
                  <List size={17} className="mx-auto" />
                </button>
              </div>
            </div>
          </div>
          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {active.map((x) => (
                <Badge key={x} variant="outline">
                  {x}
                </Badge>
              ))}
              <button
                onClick={reset}
                className="text-xs font-semibold text-primary"
              >
                {d.clearAll}
              </button>
            </div>
          )}
          <div
            className={cn(
              "mt-6 grid gap-5",
              view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
            )}
          >
            {error && (
              <div role="alert" className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
                <p>{error}</p>
                <Button variant="secondary" size="sm" onClick={retry}>{d.retry}</Button>
              </div>
            )}
            {loading ? (
              Array.from({ length: Math.min(Math.max(result.length, 3), 6) }, (_, index) => <ProductCardSkeleton key={index} />)
            ) : result.length ? (
              result.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variant={view === "list" ? "list" : "card"}
                />
              ))
            ) : !error ? (
              <EmptyState onReset={reset} query={query.trim() || undefined} filtered={active.length > 0} />
            ) : null}
          </div>
          {meta.totalPages > 1 && (
            <nav aria-label={fa ? "صفحه‌ها" : "Pages"} className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
              {meta.page > 1 ? (
                <Link rel="prev" href={pageHref(meta.page - 1)} className="text-sm font-semibold text-primary hover:underline">
                  {fa ? "صفحهٔ قبل" : "Previous page"}
                </Link>
              ) : <span />}
              <p className="font-mono text-xs text-muted-foreground">
                {fa ? `صفحهٔ ${meta.page} از ${meta.totalPages}` : `Page ${meta.page} of ${meta.totalPages}`}
              </p>
              {meta.page < meta.totalPages ? (
                <Link rel="next" href={pageHref(meta.page + 1)} className="text-sm font-semibold text-primary hover:underline">
                  {fa ? "صفحهٔ بعد" : "Next page"}
                </Link>
              ) : <span />}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
function FilterGroup({
  label,
  options,
  value,
  setValue,
}: {
  label: string;
  options: (string | number)[];
  value: string | number;
  setValue: (x: string) => void;
}) {
  const { t } = useLocale();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o}
            className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <input
              type="radio"
              name={label}
              value={o}
              checked={String(value) === String(o)}
              onChange={() => setValue(String(o))}
              className="size-4 accent-[var(--primary)]"
            />
            {o === "All" ? t.discovery.all : o === "Any" ? t.discovery.anyRating : o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
