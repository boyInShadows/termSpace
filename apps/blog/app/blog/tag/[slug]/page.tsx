import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {api} from "@/lib/api";
import {ArticleCard} from "@/components/ArticleCard";
import type {Metadata} from "next";
import {getLocale} from "@/lib/serverLocale";
import {pageMetadata} from "@/lib/siteMetadata";
import {localePath} from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const [{slug}, locale, tags] = await Promise.all([params, getLocale(), api.listTags()]);
  const tag = tags.data.find((item) => item.slug === slug);
  if (!tag) return {title: "Tag not found", robots: {index: false, follow: false}};
  return pageMetadata({
    title: `#${tag.name}`,
    description: tag.description ?? (locale === "fa" ? `مقالات برچسب‌خورده با ${tag.name} در ترم‌اسپیس.` : `Articles tagged ${tag.name} on Termspace.`),
    path: `/blog/tag/${tag.slug}`,
    locale,
  });
}

export default async function TagPage({params, searchParams}: {params: Promise<{slug: string}>; searchParams: Promise<{page?: string}>}) {
  const [{slug}, t, locale, tags, articles] = await Promise.all([
    params,
    getTranslations("Common"),
    getLocale(),
    api.listTags(),
    params.then(async ({slug}) => api.listArticles({tag: slug, published: true, page: Math.max(1, Number((await searchParams).page ?? 1) || 1), limit: 50}))
  ]);
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  const tag = tags.data.find((item) => item.slug === slug);
  if (!tag) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-ink-muted">{t("tag")}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold">{tag.name}</h1>
      {tag.description && <p className="mt-4 text-ink-soft">{tag.description}</p>}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.data.map((article) => <ArticleCard key={article.id} article={article} />)}
      </div>
      {(articles.meta.hasPrevPage || articles.meta.hasNextPage) && <nav className="mt-10 flex justify-between" aria-label="Pagination">
        {articles.meta.hasPrevPage ? <a className="text-accent" href={`${localePath(`/blog/tag/${tag.slug}`, locale)}?page=${page - 1}`}>{locale === "fa" ? "قبلی" : "Previous"}</a> : <span />}
        {articles.meta.hasNextPage ? <a className="text-accent" href={`${localePath(`/blog/tag/${tag.slug}`, locale)}?page=${page + 1}`}>{locale === "fa" ? "بعدی" : "Next"}</a> : <span />}
      </nav>}
    </div>
  );
}
