import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/marketplace/product-card";
import { ApiError, request } from "@/lib/api";
import type { Product } from "@/lib/types";
import { getLocale } from "@/lib/serverLocale";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const fa = (await getLocale()) === "fa";
  let collection: { title: string; description: string; items: Product[] };
  try {
    collection = (
      await request<{ data: typeof collection }>(
        `/api/marketplace/creators/${encodeURIComponent(handle)}/collections/${encodeURIComponent(slug)}`,
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <>
      <Header />
      <main className="container-page py-10">
        <h1 className="editorial text-5xl">{collection.title}</h1>
        <p className="mt-4">{collection.description}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {!collection.items.length && (
          <p role="status" className="mt-8">
            {fa
              ? "فعلاً مورد منتشرشده‌ای در این مجموعه نیست."
              : "No published listings in this collection yet."}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
