import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE, AVATAR_FALLBACK_IMAGE } from "@/lib/images";
import { api, ApiClientError } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, readingTime } from "@/lib/format";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleSummary } from "@/lib/types";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { Comments } from "@/components/Comments";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
import { localizeArticleFa } from "@/lib/faContent";
import { SITE_NAME, localizedAlternates, localizedUrl } from "@/lib/siteMetadata";

export const revalidate = 60;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const [{ slug }, locale] = await Promise.all([params, getLocale()]);
    const article = (await api.getArticle(slug)).data;
    const displayArticle = locale === "fa" ? localizeArticleFa(article) : article;
    const path = `/blog/${article.slug}`;
    const url = localizedUrl(path, locale);
    const description = displayArticle.excerpt ?? (locale === "fa"
      ? `مقالهٔ «${displayArticle.title}» را در ترم‌اسپیس بخوانید.`
      : `Read ${displayArticle.title} on ${SITE_NAME}.`);

    return {
      title: displayArticle.title,
      description,
      alternates: localizedAlternates(path, locale),
      openGraph: {
        title: displayArticle.title,
        description,
        type: "article",
        url,
        locale: locale === "fa" ? "fa_IR" : "en_US",
        publishedTime: article.publishedAt ?? undefined,
        modifiedTime: article.updatedAt,
        authors: [article.author.name],
        images: article.heroImage
          ? [
              {
                url: article.heroImage,
                alt: displayArticle.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: article.heroImage ? "summary_large_image" : "summary",
        title: displayArticle.title,
        description,
        images: article.heroImage ? [article.heroImage] : undefined,
      },
    };
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const locale = await getLocale();
  const { slug } = await params;
  let article;
  try {
    article = (await api.getArticle(slug)).data;
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    notFound();
  }
  const displayArticle = locale === "fa" ? localizeArticleFa(article) : article;

  const [relatedRes, commentsRes] = await Promise.all([api.listArticles({
    limit: 4,
    tag: article.tags[0]?.slug,
    category: article.tags.length === 0 ? article.category.slug : undefined,
    published: true,
  }), api.listComments(article.slug)]);
  const related = relatedRes.data.filter((a) => a.id !== article.id).slice(0, 3);

  const bodyHtml = renderMarkdown(article.content);
  const minutes = readingTime(article.content);

  return (
    <article className="mx-auto max-w-6xl px-6">
      <header className="mx-auto max-w-3xl py-12">
        <Link
          href={localePath(`/blog/category/${article.category.slug}`, locale)}
          className="text-sm font-medium text-accent hover:text-accent-soft"
        >
          {displayArticle.category.name}
        </Link>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
          {displayArticle.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">{article.tags.map((tag) => <Link key={tag.id} href={localePath(`/blog/tag/${tag.slug}`, locale)} className="rounded-full bg-paper-warm px-3 py-1 text-xs text-ink-soft">#{tag.name}</Link>)}</div>
        {displayArticle.excerpt && (
          <p className="mt-5 text-lg text-ink-soft max-w-prose">{displayArticle.excerpt}</p>
        )}
        <div className="mt-6 flex items-center gap-3 text-sm text-ink-muted">
          <SafeImage
              src={article.author.avatarUrl}
              fallback={AVATAR_FALLBACK_IMAGE}
              alt={article.author.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          <span className="font-medium text-ink-soft">{article.author.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(article.publishedAt, locale)}</span>
          <span aria-hidden="true">·</span>
          <span>{locale === "fa" ? `${minutes} دقیقه مطالعه` : `${minutes} min read`}</span>
        </div>
      </header>

      <ArticleEngagement slug={article.slug} title={displayArticle.title} />

      {article.series && <div className="mx-auto mb-8 max-w-3xl rounded-lg border border-line bg-paper-warm p-4 text-sm">{locale === "fa" ? "بخش" : "Part"} {article.seriesOrder ?? "—"} {locale === "fa" ? "از" : "of"} <Link href={localePath(`/blog/series/${article.series.slug}`, locale)} className="font-medium text-accent">{article.series.name}</Link></div>}

      <div className="mx-auto max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-paper-warm">
            <SafeImage
              src={article.heroImage}
              fallback={ARTICLE_FALLBACK_IMAGE}
              alt={article.title}
              fill
              priority
              sizes="(min-width: 1024px) 56rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>

      {locale === "fa" && <p className="mx-auto mt-10 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">ترجمهٔ فارسی این مقاله هنوز آماده نشده است؛ متن اصلی انگلیسی نمایش داده می‌شود.</p>}
      <div
        lang="en" dir="ltr"
        className="prose-article mx-auto max-w-3xl py-12"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {article.author.bio && (
        <aside className="mx-auto max-w-3xl rounded-xl border border-line bg-paper-warm p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{locale === "fa" ? "دربارهٔ نویسنده" : "About the author"}</p>
          <p className="mt-2 text-ink-soft">{article.author.bio}</p>
        </aside>
      )}

      <nav className="mx-auto max-w-3xl mt-12 flex items-center justify-between text-sm" aria-label="Article navigation">
        <Link href={localePath("/blog", locale)} className="text-ink-soft hover:text-accent">
          ← {locale === "fa" ? "همهٔ مقالات" : "All articles"}
        </Link>
        <Link href={localePath(`/blog/category/${article.category.slug}`, locale)} className="text-ink-soft hover:text-accent">
          {locale === "fa" ? `مطالب بیشتر در ${article.category.name}` : `More in ${article.category.name}`} →
        </Link>
      </nav>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl py-16">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">{locale === "fa" ? "مطالب مرتبط" : "Related reading"}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a: ArticleSummary) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
      <Comments slug={article.slug} initialComments={commentsRes.data} locale={locale} />
    </article>
  );
}
