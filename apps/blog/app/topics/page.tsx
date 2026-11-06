import { EmptyCollection } from "@/components/EmptyState";
import Link from "next/link";
import { api } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/siteMetadata";

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    title: locale === "fa" ? "کاوش موضوعات" : "Explore topics",
    description: locale === "fa" ? "مقالات ترم‌اسپیس را بر اساس دسته‌بندی، برچسب و مجموعه کاوش کنید." : "Explore Termspace articles by category, tag, and series.",
    path: "/topics",
    locale,
  });
}
export default async function TopicsPage() {
  const locale = await getLocale(); const fa = locale === "fa";
  const [categories, tags, series] = await Promise.all([api.listCategories(), api.listTags(), api.listSeries()]);
  return <div className="mx-auto max-w-6xl px-6 py-16"><h1 className="font-serif text-4xl font-semibold">{fa ? "کاوش موضوعات" : "Explore topics"}</h1><div className="mt-10 grid gap-10 md:grid-cols-3"><section><h2 className="font-serif text-2xl">{fa ? "دسته‌بندی‌ها" : "Categories"}</h2>{categories.data.length === 0 && <div className="mt-4"><EmptyCollection locale={locale} /></div>}<ul className="mt-4 space-y-2">{categories.data.map((item) => <li key={item.id}><Link className="text-accent" href={localePath(`/blog/category/${item.slug}`, locale)}>{item.name}</Link></li>)}</ul></section><section><h2 className="font-serif text-2xl">{fa ? "برچسب‌ها" : "Tags"}</h2>{tags.data.length === 0 && <div className="mt-4"><EmptyCollection locale={locale} /></div>}<ul className="mt-4 space-y-2">{tags.data.map((item) => <li key={item.id}><Link className="text-accent" href={localePath(`/blog/tag/${item.slug}`, locale)}>{item.name}</Link></li>)}</ul></section><section><h2 className="font-serif text-2xl">{fa ? "مجموعه‌ها" : "Series"}</h2>{series.data.length === 0 && <div className="mt-4"><EmptyCollection locale={locale} /></div>}<ul className="mt-4 space-y-2">{series.data.map((item) => <li key={item.id}><Link className="text-accent" href={localePath(`/blog/series/${item.slug}`, locale)}>{item.name}</Link></li>)}</ul></section></div></div>;
}
