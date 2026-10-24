"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMarketplaceLibrary } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { intlLocale } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { libraryCopy } from "./library-copy";

export function AcquiredLibrary({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLocale();
  const copy = libraryCopy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const requestedPage = Number(new URLSearchParams(query).get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [result, setResult] = useState<Awaited<ReturnType<typeof getMarketplaceLibrary>> | null>(null);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const loading = loadedPage !== page;
  const number = new Intl.NumberFormat(intlLocale(locale));
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const Title = embedded ? "h2" : "h1";

  const changePage = useCallback((next: number, replace = false) => {
    const params = new URLSearchParams(query);
    if (next === 1) params.delete("page"); else params.set("page", String(next));
    const href = `${pathname}${params.size ? `?${params}` : ""}`;
    if (replace) router.replace(href, { scroll: false }); else router.push(href, { scroll: false });
  }, [pathname, query, router]);

  useEffect(() => {
    const controller = new AbortController();
    void getMarketplaceLibrary(page, 24, controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, value.meta.totalPages);
        if (page > lastPage) { changePage(lastPage, true); return; }
        setResult(value); setError(false); setLoadedPage(page);
      })
      .catch(() => {
        if (!controller.signal.aborted) { setError(true); setLoadedPage(page); }
      });
    return () => controller.abort();
  }, [page, reload, changePage]);

  function retry() {
    setLoadedPage(null); setError(false); setReload((value) => value + 1);
  }

  return <section aria-labelledby="library-title" aria-busy={loading} className="[&_a]:scroll-mt-32 [&_button]:scroll-mt-32 [&_a]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))] [&_button]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]">
    <Title id="library-title" className="text-2xl font-semibold sm:text-3xl">{copy.title}</Title>
    <p className="mt-3 max-w-prose text-muted-foreground">{copy.intro}</p>
    {loading && <p className="mt-6 text-sm text-muted-foreground" role="status">{copy.loading}</p>}
    {!loading && error && <div className="mt-6 border-y py-5"><p className="text-sm text-destructive" role="alert">{copy.error}</p><Button className="mt-4" variant="secondary" onClick={retry}>{copy.retry}</Button></div>}
    {!loading && !error && result && (result.data.length === 0 ? <div className="mt-6 border-y py-8">
      <p className="text-sm text-muted-foreground">{copy.empty}</p>
      <Link className={`${buttonVariants({ variant: "secondary" })} mt-4`} href={localePath("/explore", locale)}>{copy.browse}</Link>
    </div> : <ul className="mt-6 divide-y border-y bg-surface">
      {result.data.map((entry) => <li className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-5" key={entry.acquisitionId}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2"><h3 className="min-w-0 max-w-full break-words font-semibold"><bdi>{entry.product.name}</bdi></h3><span className="min-w-0 max-w-full break-all text-xs text-muted-foreground">{entry.release ? <bdi className="font-mono">v{entry.release.version}</bdi> : copy.legacy}</span></div>
          <p className="mt-1 break-words text-sm text-muted-foreground">{entry.product.outcome}</p>
          <p className="mt-2 break-words text-xs text-muted-foreground"><bdi>@{entry.product.creator.handle}</bdi> · <time dateTime={entry.acquiredAt}>{date.format(new Date(entry.acquiredAt))}</time></p>
        </div>
        {entry.installationAvailable && entry.release ? <Link className={`${buttonVariants({ size: "sm", variant: "secondary" })} mt-4 shrink-0 sm:mt-0`} href={localePath(`/products/${encodeURIComponent(entry.product.slug)}`, locale)}>{copy.install}</Link>
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
