"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMarketplaceLibrary, type LibrarySort } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { intlLocale } from "@/lib/format";
import type { MarketplaceItemTypeKey } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { libraryCopy, LIBRARY_ITEM_TYPES, LIBRARY_SORTS } from "./library-copy";

const selectClass = "mt-1 block min-h-11 w-full border border-input bg-background px-3 text-sm";

export function AcquiredLibrary() {
  const { locale } = useLocale();
  const copy = libraryCopy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const params = new URLSearchParams(query);
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const q = (params.get("q") ?? "").trim().slice(0, 80);
  const typeParam = params.get("type");
  const type = LIBRARY_ITEM_TYPES.find((value) => value === typeParam) as MarketplaceItemTypeKey | undefined;
  const sortParam = params.get("sort");
  const sort = (LIBRARY_SORTS.find((value) => value === sortParam) ?? "newest") as LibrarySort;
  const filtered = Boolean(q || type || sort !== "newest");
  const key = `${page}|${q}|${type ?? ""}|${sort}`;
  const [result, setResult] = useState<Awaited<ReturnType<typeof getMarketplaceLibrary>> | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const loading = loadedKey !== key;
  const number = new Intl.NumberFormat(intlLocale(locale));
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });

  const navigate = useCallback((changes: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(query);
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value); else next.delete(name);
    }
    const href = `${pathname}${next.size ? `?${next}` : ""}`;
    if (replace) router.replace(href, { scroll: false }); else router.push(href, { scroll: false });
  }, [pathname, query, router]);
  const changePage = useCallback((next: number, replace = false) => navigate({ page: next === 1 ? null : String(next) }, replace), [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    void getMarketplaceLibrary(page, 24, controller.signal, { q, type, sort })
      .then((value) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, value.meta.totalPages);
        if (page > lastPage) { changePage(lastPage, true); return; }
        setResult(value); setError(false); setLoadedKey(key);
      })
      .catch(() => {
        if (!controller.signal.aborted) { setError(true); setLoadedKey(key); }
      });
    return () => controller.abort();
  }, [page, q, type, sort, key, reload, changePage]);

  function retry() {
    setLoadedKey(null); setError(false); setReload((value) => value + 1);
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim() || null, page: null });
  }

  return <section aria-labelledby="library-title" aria-busy={loading} className="[&_a]:scroll-mt-32 [&_button]:scroll-mt-32 [&_a]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))] [&_button]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]">
    <h1 id="library-title" className="text-2xl font-semibold sm:text-3xl">{copy.title}</h1>
    <p className="mt-3 max-w-prose text-muted-foreground">{copy.intro}</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]" role="group" aria-label={copy.filters}>
      <form className="flex items-end gap-2" role="search" onSubmit={submitSearch}>
        <div className="min-w-0 flex-1">
          <label htmlFor="library-search" className="block text-sm font-medium">{copy.searchLabel}</label>
          {/* Keyed by the address value, so back, forward and Clear filters reset the box. */}
          <Input key={q} id="library-search" name="q" type="search" maxLength={80} autoComplete="off" defaultValue={q} className="mt-1" />
        </div>
        <Button type="submit" variant="secondary">{copy.searchButton}</Button>
      </form>
      <div>
        <label htmlFor="library-type" className="block text-sm font-medium">{copy.typeLabel}</label>
        <select id="library-type" className={selectClass} value={type ?? ""} onChange={(event) => navigate({ type: event.target.value || null, page: null })}>
          <option value="">{copy.allTypes}</option>
          {LIBRARY_ITEM_TYPES.map((value) => <option key={value} value={value}>{copy.types[value]}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="library-sort" className="block text-sm font-medium">{copy.sortLabel}</label>
        <select id="library-sort" className={selectClass} value={sort} onChange={(event) => navigate({ sort: event.target.value === "newest" ? null : event.target.value, page: null })}>
          {LIBRARY_SORTS.map((value) => <option key={value} value={value}>{copy.sorts[value]}</option>)}
        </select>
      </div>
    </div>
    {loading && <p className="mt-6 text-sm text-muted-foreground" role="status">{copy.loading}</p>}
    {!loading && error && <div className="mt-6 border-y py-5"><p className="text-sm text-destructive" role="alert">{copy.error}</p><Button className="mt-4" variant="secondary" onClick={retry}>{copy.retry}</Button></div>}
    {!loading && !error && result && (result.data.length === 0 ? <div className="mt-6 border-y py-8">
      {filtered
        ? <><p className="text-sm text-muted-foreground" role="status">{copy.noMatches}</p><Button className="mt-4" variant="secondary" onClick={() => navigate({ q: null, type: null, sort: null, page: null })}>{copy.clearFilters}</Button></>
        : <><p className="text-sm text-muted-foreground">{copy.empty}</p><Link className={`${buttonVariants({ variant: "secondary" })} mt-4`} href={localePath("/explore", locale)}>{copy.browse}</Link></>}
    </div> : <ul className="mt-6 divide-y border-y bg-surface">
      {result.data.map((entry) => <li className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-5" key={entry.acquisitionId}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2"><h3 className="min-w-0 max-w-full break-words font-semibold"><bdi>{entry.product.name}</bdi></h3><span className="min-w-0 max-w-full break-all text-xs text-muted-foreground">{entry.release ? <bdi className="font-mono">v{entry.release.version}</bdi> : copy.legacy}</span></div>
          <p className="mt-1 break-words text-sm text-muted-foreground">{entry.product.outcome}</p>
          <p className="mt-2 break-words text-xs text-muted-foreground"><bdi>@{entry.product.creator.handle}</bdi> · <time dateTime={entry.acquiredAt}>{date.format(new Date(entry.acquiredAt))}</time></p>
        </div>
        {entry.installationAvailable && entry.release ? <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
          <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href={localePath(`/products/${encodeURIComponent(entry.product.slug)}`, locale)}>{copy.install}</Link>
          <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href={`${localePath(`/products/${encodeURIComponent(entry.product.slug)}`, locale)}#reviews`}>{copy.review}</Link>
        </div>
          : <p className="mt-4 text-xs font-semibold text-muted-foreground sm:mt-0">{copy.unavailable}</p>}
      </li>)}
    </ul>)}
    {result && result.meta.totalPages > 1 && <nav className="mt-6 flex items-center justify-between gap-2" aria-label={copy.pages}>
      <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>{copy.previous}</Button>
      <span className="text-center text-xs text-muted-foreground">{copy.page.replace("{page}", number.format(page)).replace("{pages}", number.format(result.meta.totalPages))}</span>
      <Button variant="secondary" size="sm" disabled={page >= result.meta.totalPages || loading} onClick={() => changePage(page + 1)}>{copy.next}</Button>
    </nav>}
  </section>;
}
