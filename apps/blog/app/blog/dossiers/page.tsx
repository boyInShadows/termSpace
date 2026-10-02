import Link from "next/link";
import { api } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export const revalidate = 60;

export default async function DossiersPage() {
  const [locale, result] = await Promise.all([getLocale(), api.listSeries(true)]);
  return <main className="mx-auto max-w-5xl px-6 py-16"><p className="text-sm uppercase tracking-widest text-ink-muted">{locale === "fa" ? "موضوعات زنده" : "Living topics"}</p><h1 className="mt-3 font-serif text-4xl font-semibold">{locale === "fa" ? "پرونده‌ها" : "Dossiers"}</h1><p className="mt-4 max-w-2xl text-ink-soft">{locale === "fa" ? "ایده‌ها، زمان‌بندی‌ها و پوشش تازه در یک جا." : "Key ideas, timelines, resources, and fresh coverage in one place."}</p><div className="mt-10 grid gap-5 md:grid-cols-2">{result.data.map((item) => <Link key={item.id} href={localePath(`/blog/dossiers/${item.slug}`, locale)} className="rounded-xl border border-line bg-paper-card p-6 hover:border-accent"><h2 className="font-serif text-2xl font-semibold">{item.name}</h2>{item.description && <p className="mt-3 text-sm text-ink-soft">{item.description}</p>}</Link>)}</div></main>;
}
