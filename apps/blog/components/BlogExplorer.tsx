"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ArticleSummary, Category, PaginationMeta } from "@/lib/types";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import type { Locale } from "@/lib/i18n";

interface BlogExplorerProps {
  initialArticles: ArticleSummary[];
  initialMeta: PaginationMeta;
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
  initialPage?: number;
  initialSort?: SortFilter;
  popularSearches?: { query: string; count: number }[];
  locale?: Locale;
}

const PAGE_SIZE = 9;
type SortFilter = "newest" | "oldest" | "title";

export function BlogExplorer({
  initialArticles,
  initialMeta,
  categories,
  initialCategory,
  initialSearch,
  initialPage,
  initialSort,
  popularSearches = [],
  locale = "en",
}: BlogExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [articles, setArticles] = useState(initialArticles);
  const [meta, setMeta] = useState(initialMeta);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch ?? "");
  const [page, setPage] = useState(initialPage ?? 1);
  const [sort, setSort] = useState<SortFilter>(initialSort ?? "newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [category, debouncedSearch, page, pathname, router, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .listArticles({
        page,
        limit: PAGE_SIZE,
        category: category || undefined,
        search: debouncedSearch || undefined,
        published: true,
        sort,
      })
      .then((res) => {
        if (cancelled) return;
        setArticles(res.data);
        setMeta(res.meta);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, category, debouncedSearch, sort]);

  function resetAndSetCategory(slug: string) {
    setCategory(slug);
    setPage(1);
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4">
        {popularSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>{locale === "fa" ? "پرطرفدار:" : "Popular:"}</span>
            {popularSearches.map((item) => <button key={item.query} type="button" onClick={() => { setSearch(item.query); setPage(1); }} className="rounded-full border border-line px-3 py-1 hover:border-accent">{item.query}</button>)}
          </div>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            aria-pressed={category === ""}
            onClick={() => resetAndSetCategory("")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              category === "" ? "bg-accent text-paper" : "bg-paper-warm text-ink-soft hover:bg-paper-card"
            }`}
          >
            {locale === "fa" ? "همه" : "All"}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => resetAndSetCategory(c.slug)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                category === c.slug ? "bg-accent text-paper" : "bg-paper-warm text-ink-soft hover:bg-paper-card"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <label htmlFor="blog-search" className="sr-only">
          {locale === "fa" ? "جست‌وجوی مقالات" : "Search articles"}
        </label>
        <input
          id="blog-search"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={locale === "fa" ? "جست‌وجوی مقالات…" : "Search articles…"}
          className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
        />

        <label htmlFor="blog-sort" className="sr-only">
          {locale === "fa" ? "مرتب‌سازی مقالات" : "Sort articles"}
        </label>
        <select
          id="blog-sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortFilter);
            setPage(1);
          }}
          className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-3 text-ink-soft focus:border-accent sm:max-w-xs"
        >
          <option value="newest">{locale === "fa" ? "تازه‌ترین" : "Newest first"}</option>
          <option value="oldest">{locale === "fa" ? "قدیمی‌ترین" : "Oldest first"}</option>
          <option value="title">{locale === "fa" ? "بر اساس عنوان" : "Title A-Z"}</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-line bg-paper-card p-5">
              <div className="aspect-[16/9] rounded-lg bg-paper-warm" />
              <div className="mt-4 h-4 w-1/3 rounded bg-paper-warm" />
              <div className="mt-2 h-5 w-3/4 rounded bg-paper-warm" />
              <div className="mt-2 h-4 w-full rounded bg-paper-warm" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={locale === "fa" ? "مقاله‌ای پیدا نشد" : "No articles found"}
          description={locale === "fa" ? "عبارت یا موضوع دیگری را امتحان کنید." : "Try a different search term or category."}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} highlight={debouncedSearch} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                disabled={!meta.hasPrevPage || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft disabled:opacity-40 hover:border-accent"
              >
                {locale === "fa" ? "قبلی" : "Previous"}
              </button>
              <span className="text-sm text-ink-muted">
                {locale === "fa" ? `صفحه ${meta.page} از ${meta.totalPages}` : `Page ${meta.page} of ${meta.totalPages}`}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft disabled:opacity-40 hover:border-accent"
              >
                {locale === "fa" ? "بعدی" : "Next"}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
