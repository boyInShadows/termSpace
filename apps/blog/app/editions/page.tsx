import { EmptyCollection } from "@/components/EmptyState";
import Link from "next/link";
import { api } from "@/lib/api";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE } from "@/lib/images";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath } from "@/lib/i18n";
import { localizeEditionFa } from "@/lib/faContent";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    title: locale === "fa" ? "شماره‌های تحریریه" : "Editorial editions",
    description: copy[locale].editionsIntro,
    path: "/editions",
    locale,
  });
}
export default async function EditionsPage() {
  const locale = await getLocale(); const t = copy[locale];
  const response = await api.listEditions(); const editions = locale === "fa" ? response.data.map(localizeEditionFa) : response.data;
  return <section className="mx-auto max-w-6xl px-6 py-16"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.3em] text-ink-muted">{t.archive}</p><h1 className="mt-4 font-serif text-5xl font-medium tracking-tight md:text-7xl">{t.editionsTitle}</h1><p className="mt-5 text-lg leading-8 text-ink-soft">{t.editionsIntro}</p></div><div className="mt-14 space-y-8">{editions.length === 0 && <EmptyCollection locale={locale} />}{editions.map((edition) => <Link key={edition.id} href={localePath(`/editions/${edition.slug}`, locale)} className="group grid overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[.8fr_1.2fr]"><div className="relative min-h-64 overflow-hidden"><SafeImage src={edition.coverImage} fallback={ARTICLE_FALLBACK_IMAGE} alt="" fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /><div className="absolute inset-0 bg-ink/25" /><span className="absolute start-6 top-5 font-serif text-6xl text-white">{String(edition.number).padStart(2, "0")}</span></div><div className="flex flex-col justify-center p-8 md:p-12" style={{ borderTop: `4px solid ${edition.accentColor}` }}><p className="font-mono text-xs uppercase tracking-[.25em] text-ink-muted">{locale === "fa" ? "شماره" : "Edition"} {String(edition.number).padStart(2, "0")} · {edition.articles.length} {t.pieces}</p><h2 className="mt-4 font-serif text-3xl font-semibold md:text-5xl">{edition.title}</h2><p className="mt-5 max-w-2xl leading-7 text-ink-soft">{edition.description}</p><span className="mt-8 text-sm font-medium text-accent group-hover:text-accent-soft">{t.enterEdition} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span></span></div></Link>)}</div></section>;
}
