"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

/**
 * Studio embeds the canonical Creator workflow. Keep a small signpost to the
 * full-width Creator workspace without implying a separate publishing path.
 */
export function StudioNotice() {
  const { locale, fa } = useLocale();
  return (
    <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft/40 px-4 py-3 text-sm">
      <p>
        {fa
          ? "استودیو اکنون از همان فرایند تأییدشدهٔ «سازنده» استفاده می‌کند و فهرست‌ها همان چرخهٔ بررسی و انتشار را طی می‌کنند."
          : "Studio now uses the verified Creator workflow. Listings follow the same review and publishing lifecycle."}
      </p>
      <Link href={localePath("/creator", locale)} className="font-semibold text-primary hover:underline">
        {fa ? "رفتن به سازنده" : "Go to Creator"}
      </Link>
    </div>
  );
}
