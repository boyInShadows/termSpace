import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCuratedCollections } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export default async function Page() {
  const locale = await getLocale(); const fa = locale === "fa";
  const collections = await getCuratedCollections();
  return <><Header /><main className="container-page py-10"><h1 className="editorial text-5xl">{fa ? "مجموعه‌ها" : "Collections"}</h1><div className="mt-8 grid gap-5 md:grid-cols-3">{collections.map((collection) => <Link key={collection.slug} href={localePath(`/collections/${collection.slug}`, locale)} className="rounded-xl border bg-surface p-6 hover:border-primary"><p className="text-xs text-muted-foreground">{collection.scope === "COMMUNITY" ? fa ? "جامعه" : "Community" : fa ? "منتخب" : "Curated"}</p><h2 className="editorial mt-4 text-2xl">{fa ? collection.titleFa ?? collection.titleEn : collection.titleEn}</h2><p className="mt-2 text-sm">{fa ? collection.descriptionFa ?? collection.descriptionEn : collection.descriptionEn}</p><p className="mt-5 text-xs">{collection.count} {fa ? "مورد" : "listings"}</p></Link>)}</div>{!collections.length && <p className="mt-8">{fa ? "مجموعهٔ منتشرشده‌ای موجود نیست." : "No collections have been published yet."}</p>}</main><Footer /></>;
}
