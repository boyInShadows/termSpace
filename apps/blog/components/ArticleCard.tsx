"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { ArticleSummary } from "@/lib/types";
import { formatDate, readingTime } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE } from "@/lib/images";
import { localePath, type Locale } from "@/lib/i18n";
import { localizeArticleFa } from "@/lib/faContent";

interface ArticleCardProps {
  article: ArticleSummary;
  featured?: boolean;
  highlight?: string;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query?.trim()) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return <>{parts.map((part, index) => part.toLowerCase() === query.trim().toLowerCase() ? <mark key={index} className="bg-amber-200">{part}</mark> : part)}</>;
}

export function ArticleCard({ article, featured = false, highlight }: ArticleCardProps) {
  const locale = useLocale() as Locale;
  const href = localePath(`/blog/${article.slug}`, locale);
  const display = locale === "fa" ? localizeArticleFa(article) : article;
  const minutes = article.readingMinutes ?? readingTime(display.excerpt ?? "");

  if (featured) {
    return (
      <Link
        href={href}
        className="group block overflow-hidden rounded-xl border border-line bg-paper-card transition-shadow hover:shadow-lg"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-paper-warm">
          <SafeImage
              src={article.heroImage}
              fallback={ARTICLE_FALLBACK_IMAGE}
              alt={display.title}
              fill
              sizes="(min-width: 1024px) 72rem, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="text-accent font-medium">{display.category.name}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(article.publishedAt, locale)}</span>
          </div>
          <h3 className="mt-3 font-serif text-2xl font-semibold leading-snug group-hover:text-accent">
            {display.title}
          </h3>
          {display.excerpt && (
            <p className="mt-3 text-ink-soft line-clamp-3"><HighlightedText text={display.excerpt} query={highlight} /></p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
            <span>{article.author.name}</span>
            <span aria-hidden="true">·</span>
            <span>{locale === "fa" ? `${minutes} دقیقه مطالعه` : `${minutes} min read`}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-paper-warm">
          <SafeImage
            src={article.heroImage}
            fallback={ARTICLE_FALLBACK_IMAGE}
            alt={display.title}
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="text-accent font-medium">{display.category.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(article.publishedAt, locale)}</span>
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-accent">
          {display.title}
        </h3>
        {display.excerpt && (
          <p className="text-sm text-ink-soft line-clamp-2"><HighlightedText text={display.excerpt} query={highlight} /></p>
        )}
        <div className="mt-auto flex items-center gap-2 text-xs text-ink-muted">
          <span>{article.author.name}</span>
          <span aria-hidden="true">·</span>
          <span>{locale === "fa" ? `${minutes} دقیقه مطالعه` : `${minutes} min read`}</span>
        </div>
      </div>
    </Link>
  );
}
