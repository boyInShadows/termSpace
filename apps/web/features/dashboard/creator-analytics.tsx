"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Analytics = { id: string; slug: string; name: string; rating: number; reviewCount: number; views: number; installationViews: number; acquisitions: number; recentAcquisitions: number; acquisitionConversionPercent: number | null; installationConversionPercent: number | null; daily: Array<{ day: string; views: number; installationViews: number; rating: number | null }>; versions: Array<{ version: string; acquisitions: number }> };

export function CreatorAnalytics() {
  const { fa, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Analytics[] | null>(null);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void request<{ data: Analytics[]; meta: { totalPages: number } }>(`/api/marketplace/creator/analytics?page=${page}&limit=20`, { signal: controller.signal }).then((result) => { setData(result.data); setPages(result.meta.totalPages); setError(""); }).catch((cause) => { if (!controller.signal.aborted) setError((cause as Error).message); });
    return () => controller.abort();
  }, [page]);
  const number = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  return <section className="space-y-5"><h1 className="editorial text-4xl">{fa ? "آمار سازنده" : "Creator analytics"}</h1><p className="text-sm text-muted-foreground">{fa ? "بازدیدها به صورت شمارندهٔ روزانه، بدون شناسهٔ بازدیدکننده ذخیره می‌شوند. نرخ‌ها تخمینی‌اند." : "Views are stored as daily counts without visitor identifiers. Conversion rates are approximate."}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {data?.length === 0 && <p>{fa ? "هنوز موردی ندارید." : "No listings yet."}</p>}
    {data?.map((item) => <article key={item.id} className="rounded-xl border bg-surface p-5"><Link href={localePath(`/products/${item.slug}`, locale)} className="text-lg font-semibold text-primary underline">{item.name}</Link><dl className="mt-4 grid gap-4 sm:grid-cols-3"><Metric label={fa ? "بازدید ۳۰ روزه" : "30-day views"} value={number.format(item.views)} /><Metric label={fa ? "دریافت ۳۰ روزه" : "30-day acquisitions"} value={number.format(item.recentAcquisitions)} /><Metric label={fa ? "بازدید نصب" : "Installation views"} value={number.format(item.installationViews)} /><Metric label={fa ? "نرخ دریافت" : "Acquisition conversion"} value={item.acquisitionConversionPercent === null ? "—" : `${item.acquisitionConversionPercent}%`} /><Metric label={fa ? "نرخ مشاهده نصب" : "Installation view conversion"} value={item.installationConversionPercent === null ? "—" : `${item.installationConversionPercent}%`} /><Metric label={fa ? "امتیاز" : "Rating"} value={`${item.rating}/5 · ${item.reviewCount}`} /></dl>
      <h2 className="mt-5 font-semibold">{fa ? "استفاده از نسخه‌ها" : "Version adoption"}</h2><p className="mt-2 text-sm">{item.versions.length ? item.versions.map((version) => `v${version.version}: ${number.format(version.acquisitions)}`).join(" · ") : "—"}</p>
      <details className="mt-4"><summary className="cursor-pointer font-semibold">{fa ? "روند روزانه و امتیاز" : "Daily views and rating trend"}</summary><div className="mt-3 max-h-60 overflow-auto"><table className="w-full text-sm"><thead><tr><th className="text-start">{fa ? "روز" : "Day"}</th><th className="text-end">{fa ? "بازدید" : "Views"}</th><th className="text-end">{fa ? "نصب" : "Install"}</th><th className="text-end">{fa ? "امتیاز" : "Rating"}</th></tr></thead><tbody>{item.daily.map((day) => <tr key={day.day} className="border-t"><td>{new Date(day.day).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")}</td><td className="text-end">{number.format(day.views)}</td><td className="text-end">{number.format(day.installationViews)}</td><td className="text-end">{day.rating ?? "—"}</td></tr>)}</tbody></table></div></details>
    </article>)}
    {pages > 1 && <nav aria-label={fa ? "صفحه‌های آمار" : "Analytics pages"} className="flex items-center gap-3"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{fa ? "قبلی" : "Previous"}</Button><span>{page}/{pages}</span><Button type="button" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{fa ? "بعدی" : "Next"}</Button></nav>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
