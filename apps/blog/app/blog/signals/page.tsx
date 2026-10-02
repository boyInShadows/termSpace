import { api } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { getLocale } from "@/lib/serverLocale";
import Link from "next/link";
import { localePath } from "@/lib/i18n";

export const revalidate = 60;

export default async function SignalsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [locale, result] = await Promise.all([getLocale(), api.listArticles({ kind: "SIGNAL", published: true, limit: 24, page })]);
  return <main className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm uppercase tracking-widest text-ink-muted">{locale === "fa" ? "میان مقاله‌ها" : "Between the essays"}</p><h1 className="mt-3 font-serif text-4xl font-semibold">Signals</h1><p className="mt-4 max-w-2xl text-ink-soft">{locale === "fa" ? "تغییرات، داده‌ها و ابزارهایی که ارزش توجه دارند." : "Concise notes on changes, numbers, patterns, quotes, and tools worth noticing."}</p><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.data.map((article) => <ArticleCard key={article.id} article={article} />)}</div><nav className="mt-8 flex justify-between text-sm" aria-label="Signals pages">{result.meta.hasPrevPage ? <Link href={localePath(`/blog/signals?page=${page - 1}`, locale)} className="text-accent">Previous</Link> : <span />}{result.meta.hasNextPage && <Link href={localePath(`/blog/signals?page=${page + 1}`, locale)} className="text-accent">Next</Link>}</nav></main>;
}
