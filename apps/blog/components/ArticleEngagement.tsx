"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { BOOKMARKS_KEY, HISTORY_KEY, readLocalLibrary } from "@/lib/readerLibrary";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/i18n";

export function ArticleEngagement({ slug, title }: { slug: string; title: string }) {
  const pathname = usePathname() ?? "/"; const isFa = pathname === "/fa" || pathname.startsWith("/fa/");
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setBookmarked(readLocalLibrary(BOOKMARKS_KEY).some((item) => item.slug === slug));
    let authenticated = false;
    api.getReaderLibrary().then(({ data }) => {
      authenticated = true;
      setSignedIn(true);
      setBookmarked(data.bookmarks.some((item) => item.article.slug === slug));
    }).catch(() => setSignedIn(false));
    let syncTimer: ReturnType<typeof setTimeout> | undefined;
    function record() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100;
      setProgress(value);
      const item = { slug, title, progress: value, visitedAt: new Date().toISOString() };
      const history = [item, ...readLocalLibrary(HISTORY_KEY).filter((entry) => entry.slug !== slug)].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      clearTimeout(syncTimer);
      if (authenticated) syncTimer = setTimeout(() => api.saveReaderProgress(slug, value).catch((error) => {
        if (!(error instanceof ApiClientError && error.status === 401)) console.error(error);
      }), 1200);
    }
    record();
    window.addEventListener("scroll", record, { passive: true });
    return () => { window.removeEventListener("scroll", record); clearTimeout(syncTimer); };
  }, [slug, title]);

  function toggleBookmark() {
    const item = { slug, title, progress, visitedAt: new Date().toISOString() };
    const current = readLocalLibrary(BOOKMARKS_KEY);
    const next = bookmarked ? current.filter((entry) => entry.slug !== slug) : [item, ...current];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    setBookmarked(!bookmarked);
    if (signedIn) void api.setReaderBookmark(slug, !bookmarked).catch(() => {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current));
      setBookmarked(bookmarked);
    });
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title, url });
    else await navigator.clipboard.writeText(url);
  }

  return <><div className="fixed left-0 top-0 z-[60] h-1 bg-accent transition-[width]" style={{ width: `${progress}%` }} aria-hidden="true" /><div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 py-4"><button onClick={toggleBookmark} className="rounded-full border border-line px-4 py-2 text-sm">{bookmarked ? (isFa ? "ذخیره شد" : "Bookmarked") : (isFa ? "ذخیره" : "Bookmark")}</button><button onClick={share} className="rounded-full border border-line px-4 py-2 text-sm">{isFa ? "اشتراک‌گذاری" : "Share"}</button>{!signedIn && <a href={localePath("/account", isFa ? "fa" : "en")} className="text-xs text-ink-muted hover:text-accent">{isFa ? "برای همگام‌سازی وارد شوید" : "Sign in to sync"}</a>}</div></>;
}
