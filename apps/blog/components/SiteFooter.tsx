"use client";

import Link from "next/link";
import {useLocale} from "next-intl";
import {copy, localePath, type Locale} from "@/lib/i18n";

export function SiteFooter() {
  const locale = useLocale() as Locale;
  const t = copy[locale];
  const topics = locale === "fa"
    ? [["artificial-intelligence", "هوش مصنوعی"], ["software-engineering", "مهندسی نرم‌افزار"], ["design", "طراحی"]]
    : [["artificial-intelligence", "Artificial Intelligence"], ["software-engineering", "Software Engineering"], ["design", "Design"]];

  // The policies live on the main site and cover both products.
  const webUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const legal = locale === "fa"
    ? [["privacy", "حریم خصوصی"], ["terms", "شرایط استفاده"], ["content-policy", "سیاست محتوا"]]
    : [["privacy", "Privacy"], ["terms", "Terms"], ["content-policy", "Content policy"]];

  return (
    <footer className="border-t border-line bg-paper-warm">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-serif text-lg font-semibold">Termspace</p>
            <p className="mt-2 text-sm text-ink-muted">{t.footer}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-soft">{t.explore}</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li><Link href={localePath("/blog", locale)} className="text-ink-soft hover:text-ink">{t.allArticles}</Link></li>
              <li><Link href={localePath("/editions", locale)} className="text-ink-soft hover:text-ink">{t.editionsTitle}</Link></li>
              <li><Link href={localePath("/resources", locale)} className="text-ink-soft hover:text-ink">{t.markdownResources}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-soft">{t.topics}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {topics.map(([slug, label]) => <li key={slug}><Link href={localePath(`/blog/category/${slug}`, locale)} className="text-ink-soft hover:text-ink">{label}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-line-soft pt-6 text-sm text-ink-faint">
          <ul className="mb-3 flex flex-wrap gap-x-5">
            {legal.map(([slug, label]) => <li key={slug}><a href={`${webUrl}${locale === "fa" ? "/fa" : ""}/${slug}`} className="inline-block py-2 text-ink-soft hover:text-ink">{label}</a></li>)}
          </ul>
          <p>© {new Date().getFullYear()} Termspace. {t.crafted}</p>
        </div>
      </div>
    </footer>
  );
}
