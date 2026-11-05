import Link from "next/link";
import { api } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    title: locale === "fa" ? "منابع مارک‌داون" : "Markdown resources",
    description: copy[locale].resourcesIntro,
    path: "/resources",
    locale,
  });
}

export default async function ResourcesPage() {
  const locale = await getLocale(); const t = copy[locale];
  const { data: resources } = await api.listResources();
  return <section className="mx-auto max-w-6xl px-6 py-16"><p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{t.resourceLibrary}</p><h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">{t.resourcesTitle}</h1><p className="mt-4 max-w-2xl text-ink-soft">{t.resourcesIntro}</p><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{resources.map((resource) => <article key={resource.id} className="flex flex-col rounded-xl border border-line bg-white p-6"><p className="text-xs font-medium uppercase tracking-widest text-accent">{resource.category}</p><h2 className="mt-3 font-serif text-2xl font-semibold">{resource.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-ink-soft">{resource.description}</p><div className="mt-6 flex items-center gap-4 text-sm font-medium"><Link href={localePath(`/resources/${resource.slug}`, locale)} className="text-accent hover:text-accent-soft">{t.review} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span></Link><a href={`${process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4001"}/api/resources/${resource.slug}/download`} className="text-ink-soft hover:text-ink">{t.download}</a></div></article>)}{resources.length === 0 && <p className="text-sm text-ink-muted">{t.noResources}</p>}</div></section>;
}
