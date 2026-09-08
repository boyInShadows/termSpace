import {notFound} from "next/navigation";
import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {ApiClientError, api} from "@/lib/api";
import {getLocale} from "@/lib/serverLocale";
import {localePath} from "@/lib/i18n";
import {localizeArticleFa} from "@/lib/faContent";
import type {Metadata} from "next";
import {pageMetadata} from "@/lib/siteMetadata";

export const revalidate = 60;

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  try {
    const [{slug}, locale] = await Promise.all([params, getLocale()]);
    const {data: series} = await api.getSeries(slug);
    return pageMetadata({
      title: series.name,
      description: series.description ?? (locale === "fa" ? `مجموعهٔ ${series.name} در ترم‌اسپیس.` : `${series.name}, a Termspace article series.`),
      path: `/blog/series/${series.slug}`,
      locale,
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    return {title: "Series not found", robots: {index: false, follow: false}};
  }
}

export default async function SeriesPage({params}: {params: Promise<{slug: string}>}) {
  const [{slug}, locale, t] = await Promise.all([params, getLocale(), getTranslations("Common")]);
  let series;
  try {
    series = (await api.getSeries(slug)).data;
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-ink-muted">{t("series")}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold">{series.name}</h1>
      {series.description && <p className="mt-4 text-ink-soft">{series.description}</p>}
      <ol className="mt-10 space-y-4">
        {series.articles.map((article, index) => {
          const display = locale === "fa" ? localizeArticleFa(article) : article;
          return <li key={article.id} className="rounded-lg border border-line bg-paper-card p-5">
            <Link href={localePath(`/blog/${article.slug}`, locale)} className="font-serif text-xl font-semibold hover:text-accent">{article.seriesOrder ?? index + 1}. {display.title}</Link>
            {display.excerpt && <p className="mt-2 text-sm text-ink-soft">{display.excerpt}</p>}
          </li>;
        })}
      </ol>
    </div>
  );
}
