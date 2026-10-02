import { notFound } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export const revalidate = 60;

export default async function DossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  let dossier;
  try { dossier = (await api.getSeries(slug)).data; }
  catch (error) { if (error instanceof ApiClientError && error.status === 404) notFound(); throw error; }
  if (!dossier.dossierPublished || !dossier.dossierContent) notFound();
  return <main className="mx-auto max-w-4xl px-6 py-16"><Link href={localePath("/blog/dossiers", locale)} className="text-sm text-accent">← {locale === "fa" ? "پرونده‌ها" : "Dossiers"}</Link><h1 className="mt-5 font-serif text-4xl font-semibold">{dossier.name}</h1>{dossier.description && <p className="mt-4 text-lg text-ink-soft">{dossier.description}</p>}{dossier.dossierUpdatedAt && <p className="mt-3 text-xs text-ink-muted">{locale === "fa" ? "آخرین به‌روزرسانی" : "Updated"} {new Date(dossier.dossierUpdatedAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en")}</p>}
    <div className="prose-article mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(dossier.dossierContent) }} />
    <section className="mt-12"><h2 className="font-serif text-2xl font-semibold">{locale === "fa" ? "پوشش مرتبط" : "Latest coverage"}</h2><ol className="mt-5 space-y-3">{dossier.articles.map((article) => <li key={article.id}><Link href={localePath(`/blog/${article.slug}`, locale)} className="text-accent hover:underline">{article.title}</Link></li>)}</ol></section>
  </main>;
}
