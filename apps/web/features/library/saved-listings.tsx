"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites } from "@/lib/api";
import { getProductsBySlugs } from "@/lib/account-api";
import type { Product } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { Button, buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { libraryCopy } from "./library-copy";
import { savedCopy } from "./saved-copy";

const PAGE_SIZE = 12;
type Entry = { slug: string } & ({ status: "ready"; product: Product } | { status: "unavailable" });

export function SavedListings() {
  const { locale } = useLocale();
  const copy = savedCopy[locale];
  const labels = libraryCopy[locale];
  const session = useMarketplaceSession();
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    if (session.loading) return;
    const controller = new AbortController();
    void getFavorites(controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setSlugs(result); setError(false);
        setPage((current) => Math.min(current, Math.max(0, Math.ceil(result.length / PAGE_SIZE) - 1)));
      }
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt, session.loading]);

  useEffect(() => {
    if (!slugs) return;
    const controller = new AbortController();
    // The favourites list is slugs only; one request resolves a 12-item page and a slug that
    // is not published any more simply comes back missing.
    const pageSlugs = slugs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    void (pageSlugs.length ? getProductsBySlugs(pageSlugs, controller.signal) : Promise.resolve([]))
      .then((products) => {
        if (controller.signal.aborted) return;
        const bySlug = new Map(products.map((product) => [product.slug, product]));
        setError(false);
        setEntries(pageSlugs.map((slug): Entry => { const product = bySlug.get(slug); return product ? { slug, status: "ready", product } : { slug, status: "unavailable" }; }));
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [slugs, page, attempt]);

  function retry() {
    setError(false); setEntries(null); setAttempt((value) => value + 1);
  }
  async function remove(slug: string) {
    if (busy) return;
    setBusy(slug); setRemoveError(null);
    try {
      await session.removeFavorite(slug);
      const next = slugs!.filter((value) => value !== slug);
      setSlugs(next); setEntries(null);
      setPage((value) => Math.min(value, Math.max(0, Math.ceil(next.length / PAGE_SIZE) - 1)));
    } catch { setRemoveError(slug); }
    finally { setBusy(null); }
  }

  return <section aria-labelledby="saved-title" aria-busy={session.loading || (!error && entries === null)}>
    <h1 id="saved-title" className="text-2xl font-semibold sm:text-3xl">{copy.title}</h1>
    <p className="mt-3 text-muted-foreground">{copy.intro}</p>
    {session.loading || (!error && entries === null) ? <p className="mt-6 text-sm text-muted-foreground" role="status">{copy.loading}</p>
      : error ? <div className="mt-6 border-y py-5"><p role="alert" className="text-sm text-destructive">{copy.error}</p><Button className="mt-4" variant="secondary" onClick={retry}>{labels.retry}</Button></div>
        : slugs?.length === 0 ? <div className="mt-6 border-y py-8"><p>{copy.empty}</p><Link className={`${buttonVariants({ variant: "secondary" })} mt-4`} href={localePath("/explore", locale)}>{labels.browse}</Link></div>
          : <ul className="mt-6 divide-y border-y bg-surface">{entries?.map((entry) => <li key={entry.slug} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {entry.status === "ready" ? <><h2 className="break-words font-semibold"><Link className="block min-h-11 py-2 hover:underline" href={localePath(`/products/${encodeURIComponent(entry.slug)}`, locale)}><bdi>{entry.product.name}</bdi></Link></h2><p dir="auto" className="break-words text-sm text-muted-foreground">{entry.product.outcome}</p></>
                : <><p className="text-sm text-muted-foreground">{copy.unavailable}</p></>}
              {removeError === entry.slug && <p role="alert" className="mt-3 text-sm text-destructive">{copy.removeError}</p>}
            </div>
            <Button className="shrink-0" variant="secondary" disabled={busy !== null} onClick={() => void remove(entry.slug)}>{busy === entry.slug ? copy.loading : copy.remove}</Button>
          </li>)}</ul>}
    {!session.loading && slugs && slugs.length > PAGE_SIZE && <nav aria-label={labels.pages} className="mt-6 flex items-center justify-between gap-4">
      <Button variant="secondary" disabled={entries === null || busy !== null || page === 0} onClick={() => { setEntries(null); setPage((value) => value - 1); }}>{labels.previous}</Button>
      <span className="text-center text-xs text-muted-foreground">{labels.page.replace("{page}", new Intl.NumberFormat(locale).format(page + 1)).replace("{pages}", new Intl.NumberFormat(locale).format(Math.ceil(slugs.length / PAGE_SIZE)))}</span>
      <Button variant="secondary" disabled={entries === null || busy !== null || (page + 1) * PAGE_SIZE >= slugs.length} onClick={() => { setEntries(null); setPage((value) => value + 1); }}>{labels.next}</Button>
    </nav>}
  </section>;
}
