import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiClientError, api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath } from "@/lib/i18n";
import type { Metadata } from "next";
import { localizedAlternates, localizedUrl } from "@/lib/siteMetadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const [{ slug }, locale] = await Promise.all([params, getLocale()]);
    const { data } = await api.getResource(slug);
    const path = `/resources/${data.slug}`;
    return {
      title: data.title,
      description: data.description,
      alternates: localizedAlternates(path, locale),
      openGraph: {
        title: data.title,
        description: data.description,
        type: "article",
        url: localizedUrl(path, locale),
        locale: locale === "fa" ? "fa_IR" : "en_US",
      },
    };
  }
  catch { return {}; }
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale(); const t = copy[locale];
  let resource;
  try { resource = (await api.getResource((await params).slug)).data; }
  catch (error) { if (error instanceof ApiClientError && error.status === 404) notFound(); throw error; }
  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4001"}/api/resources/${resource.slug}/download`;
  return <section className="mx-auto max-w-4xl px-6 py-16"><Link href={localePath("/resources", locale)} className="text-sm font-medium text-accent hover:text-accent-soft"><span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {locale === "fa" ? "همهٔ منابع" : "All resources"}</Link><div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6"><div><p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{resource.category}</p><p className="mt-2 text-sm text-ink-soft">{locale === "fa" ? "فایل را در ادامه مرور کنید یا برای ویرایش دریافت کنید." : "Preview the file below or download it for editing."}</p></div><a href={downloadUrl} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft">{t.download}</a></div><article className="prose-article mt-10 rounded-xl border border-line bg-white p-6 sm:p-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.content) }} /></section>;
}
