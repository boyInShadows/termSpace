import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getDiscoveryOptions, getMarketplaceItemTypes, getProducts } from "@/lib/api";
import type { ProductFilters } from "@/lib/types";
export const metadata: Metadata = { title: "Explore" };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const filters: ProductFilters = { q: first(raw.q), type: first(raw.type), category: first(raw.category), platform: first(raw.platform), model: first(raw.model), community: first(raw.community), sort: first(raw.sort) ?? "featured", page: 1, limit: 12 };
  const [result, options, itemTypes] = await Promise.all([
    getProducts(filters).then((initial) => ({ initial, error: null })).catch(() => ({ initial: { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } }, error: "Discovery is unavailable. Please retry." })),
    getDiscoveryOptions(),
    getMarketplaceItemTypes(),
  ]);
  return (
    <>
      <Header />
      <DiscoveryExperience initial={result.initial} initialError={result.error} options={options} itemTypes={itemTypes} initialFilters={filters} />
      <Footer />
    </>
  );
}
