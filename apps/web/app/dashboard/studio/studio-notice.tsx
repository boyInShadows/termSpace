"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

/**
 * Studio publishes through the legacy /api/community path, which skips
 * moderation; Creator is its replacement. Until the other maintainer confirms
 * Creator covers everything Studio does (the three questions in
 * changelog.md, 2026-09-24, P7), Studio stays
 * and says so. When they do, this route becomes a redirect.
 */
export function StudioNotice() {
  const { locale, fa } = useLocale();
  return (
    <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft/40 px-4 py-3 text-sm">
      <p>{fa ? "استودیو با «سازنده» جایگزین می‌شود. فهرست‌های تازه را از آنجا شروع کنید." : "Studio is being replaced by Creator. New listings should start there."}</p>
      <Link href={localePath("/creator", locale)} className="font-semibold text-primary hover:underline">
        {fa ? "رفتن به سازنده" : "Go to Creator"}
      </Link>
    </div>
  );
}
