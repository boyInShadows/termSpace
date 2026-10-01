import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/marketplace/product-card";
import { ApiError, request } from "@/lib/api";
import type { CuratedCollection, Product } from "@/lib/types";
import { getLocale } from "@/lib/serverLocale";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fa = (await getLocale()) === "fa";
  let collection: CuratedCollection & { items: Product[] };
  try { collection = (await request<{ data: typeof collection }>(`/api/marketplace/collections/${encodeURIComponent(slug)}`)).data; }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  return <><Header /><main className="container-page py-10"><p className="eyebrow">{collection.scope === "COMMUNITY" ? fa ? "مجموعهٔ جامعه" : "Community collection" : fa ? "مجموعهٔ منتخب" : "Curated collection"}</p><h1 className="editorial mt-3 text-5xl">{fa ? collection.titleFa ?? collection.titleEn : collection.titleEn}</h1><p className="mt-4 max-w-3xl">{fa ? collection.descriptionFa ?? collection.descriptionEn : collection.descriptionEn}</p><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{collection.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>{!collection.items.length && <p role="status" className="mt-8">{fa ? "هنوز مورد منتشرشده‌ای در این مجموعه نیست." : "No public listings in this collection yet."}</p>}</main><Footer /></>;
}
