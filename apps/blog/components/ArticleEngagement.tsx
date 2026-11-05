"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { BOOKMARKS_KEY, HISTORY_KEY, readLocalLibrary } from "@/lib/readerLibrary";
import { useLocale } from "next-intl";
import { localePath } from "@/lib/i18n";

export function ArticleEngagement({ slug, title }: { slug: string; title: string }) {
  const isFa = useLocale() === "fa";
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const pending = useRef(false);

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
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* Reading still works when browser storage is unavailable. */ }
      clearTimeout(syncTimer);
      if (authenticated) syncTimer = setTimeout(() => api.saveReaderProgress(slug, value).catch((error) => {
        if (!(error instanceof ApiClientError && error.status === 401)) console.error(error);
      }), 1200);
    }
    record();
    window.addEventListener("scroll", record, { passive: true });
    return () => { window.removeEventListener("scroll", record); clearTimeout(syncTimer); };
  }, [slug, title]);

  async function toggleBookmark() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    const item = { slug, title, progress, visitedAt: new Date().toISOString() };
    const current = readLocalLibrary(BOOKMARKS_KEY);
    const next = bookmarked ? current.filter((entry) => entry.slug !== slug) : [item, ...current];
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      setBookmarked(!bookmarked);
      if (signedIn) await api.setReaderBookmark(slug, !bookmarked);
      setFeedback({ kind: "success", text: isFa ? (bookmarked ? "نشانک حذف شد." : "نشانک ذخیره شد.") : (bookmarked ? "Bookmark removed." : "Bookmark saved.") });
    } catch {
      try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current)); } catch { /* Storage may be unavailable. */ }
      setBookmarked(bookmarked);
      setFeedback({ kind: "error", text: isFa ? "ذخیرهٔ نشانک انجام نشد. دوباره تلاش کنید." : "Could not save your bookmark. Try again." });
    } finally { pending.current = false; setSaving(false); }
  }

  async function share() {
    const url = window.location.href;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
      setFeedback({ kind: "success", text: canShare ? (isFa ? "به اشتراک گذاشته شد." : "Shared.") : (isFa ? "پیوند کپی شد." : "Link copied.") });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFeedback({ kind: "error", text: isFa ? "اشتراک‌گذاری انجام نشد. دوباره تلاش کنید." : "Could not share this article. Try again." });
    }
  }

  return <><div className="fixed left-0 top-0 z-[60] h-1 bg-accent transition-[width]" style={{ width: `${progress}%` }} aria-hidden="true" /><div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 py-4"><button disabled={saving} aria-pressed={bookmarked} onClick={() => void toggleBookmark()} className="rounded-full border border-line px-4 py-2 text-sm">{bookmarked ? (isFa ? "ذخیره شد" : "Bookmarked") : (isFa ? "ذخیره" : "Bookmark")}</button><button onClick={share} className="rounded-full border border-line px-4 py-2 text-sm">{isFa ? "اشتراک‌گذاری" : "Share"}</button>{!signedIn && <a href={localePath("/account", isFa ? "fa" : "en")} className="text-xs text-ink-muted hover:text-accent">{isFa ? "برای همگام‌سازی وارد شوید" : "Sign in to sync"}</a>}{feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className="w-full text-sm">{feedback.text}</p>}</div></>;
}
