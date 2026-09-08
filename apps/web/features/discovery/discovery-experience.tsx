"use client";
import { useEffect, useState } from "react";
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
import type { ProductFilters, ProductPageResult, ProductType } from "@/lib/types";
import { ApiError, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/marketplace/product-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
const types: (ProductType | "All")[] = [
  "All",
  "Prompt",
  "Prompt pack",
  "Skill",
  "Agent",
  "Workflow",
  "MCP server",
  "Developer utility",
];
export function DiscoveryExperience({ initial, categories, initialFilters }: { initial: ProductPageResult; categories: string[]; initialFilters: ProductFilters }) {
  const { t } = useLocale();
  const d = t.discovery;
  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [type, setType] = useState<string>(initialFilters.type ?? "All");
  const [category, setCategory] = useState(initialFilters.category ?? "All");
  const [platform, setPlatform] = useState(initialFilters.platform ?? "All");
  const [price, setPrice] = useState(initialFilters.price === "free" ? "Free" : initialFilters.price === "paid" ? "Paid" : "All");
  const [verified, setVerified] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState(initialFilters.sort ?? "featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [result, setResult] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const next = await getProducts({ q: query, type, category, platform, price: price === "Free" ? "free" : price === "Paid" ? "paid" : undefined, verified, minRating, sort, page, limit: 12 }, controller.signal);
        setResult((current) => page === 1 ? next.data : [...current, ...next.data]); setMeta(next.meta);
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("Product search failed", cause);
          setError(cause instanceof ApiError ? cause.code === "RATE_LIMITED" ? d.rateLimited : cause.message : d.connectionError);
        }
      }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, type, category, platform, price, verified, minRating, sort, page, retryNonce]);
  const change = (setter: (value: string) => void) => (value: string) => { setPage(1); setter(value); };
  const reset = () => {
    setPage(1);
    setQuery("");
    setType("All");
    setCategory("All");
    setPlatform("All");
    setPrice("All");
    setVerified(false);
    setMinRating(0);
  };
  const active = [
    type !== "All" && type,
    category !== "All" && category,
    platform !== "All" && platform,
    price !== "All" && price,
    verified && "Verified",
    minRating > 0 && `${minRating}+ ${d.rating}`,
  ].filter(Boolean) as string[];
  const filters = (
    <div className="space-y-7">
      <FilterGroup
        label={d.category}
        options={["All", ...categories]}
        value={category}
        setValue={change(setCategory)}
      />
      <FilterGroup
        label={d.compatibility}
        options={[
          "All",
          "Claude",
          "ChatGPT",
          "Codex",
          "Cursor",
          "VS Code",
          "Gemini",
        ]}
        value={platform}
        setValue={change(setPlatform)}
      />
      <FilterGroup
        label={d.pricing}
        options={["All", "Free", "Paid"]}
        value={price}
        setValue={change(setPrice)}
      />
      <FilterGroup
        label={d.rating}
        options={["Any", "4.5+", "4.8+"]}
        value={minRating === 0 ? "Any" : `${minRating}+`}
        setValue={(v) => { setPage(1); setMinRating(v === "Any" ? 0 : parseFloat(v)); }}
      />
      <div className="flex items-center justify-between">
        <label htmlFor="verified" className="text-sm font-medium">
          {d.verifiedOnly}
        </label>
        <Switch.Root
          id="verified"
          checked={verified}
          onCheckedChange={(value) => { setPage(1); setVerified(value); }}
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
        <p className="eyebrow">{d.marketplace}</p>
        <h1 className="editorial mt-2 text-5xl">{d.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {d.intro}
        </p>
      </div>
      <div className="relative mt-8 max-w-4xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          placeholder={d.search}
          className="h-14 pl-12 text-base"
        />
      </div>
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label={d.productType}
      >
        {types.map((t) => (
          <button
            role="tab"
            aria-selected={type === t}
            key={t}
            onClick={() => { setPage(1); setType(t); }}
            className={cn(
              "min-h-10 shrink-0 border-b-2 px-3 text-sm font-medium",
              type === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "All" ? d.all : t}
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
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm">
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
                        {d.showResults.replace("{count}", String(result.length))}
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
                onChange={(e) => { setPage(1); setSort(e.target.value); }}
                className="min-h-10 rounded-md border bg-surface px-3 text-sm"
              >
                <option value="featured">{d.featured}</option>
                <option value="rating">{d.topRated}</option>
                <option value="newest">{d.recentlyUpdated}</option>
                <option value="price-low">{d.priceLow}</option>
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
                <Button variant="secondary" size="sm" onClick={() => setRetryNonce((value) => value + 1)}>{d.retry}</Button>
              </div>
            )}
            {result.length ? (
              result.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variant={view === "list" ? "list" : "compact"}
                />
              ))
            ) : (
              <EmptyState onReset={reset} />
            )}
          </div>
          {meta.page < meta.totalPages && (
            <div className="mt-10 flex justify-center">
              <Button variant="secondary" disabled={loading} onClick={() => setPage((value) => value + 1)}>{loading ? d.loading : d.loadMore}</Button>
            </div>
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
