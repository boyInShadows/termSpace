import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getMarketplaceCommunities, getMarketplaceHome, getMarketplaceItemTypes, getProducts } from "@/lib/api";
import type { ProductFilters } from "@/lib/types";
export const metadata: Metadata = { title: "Explore" };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const filters: ProductFilters = { q: first(raw.q), type: first(raw.type), category: first(raw.category), community: first(raw.community), platform: first(raw.platform), sort: first(raw.sort) ?? "featured", page: 1, limit: 12 };
  const [initialState, home, communities, itemTypes] = await Promise.all([
    getProducts(filters)
      .then((result) => ({ result, error: false }))
      .catch(() => ({ result: { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } }, error: true })),
    getMarketplaceHome().catch(() => null),
    getMarketplaceCommunities().catch(() => []),
    getMarketplaceItemTypes().catch(() => []),
  ]);
  return (
    <>
      <Header />
      <DiscoveryExperience initial={initialState.result} initialError={initialState.error} categories={home?.categories ?? []} platforms={home?.platforms ?? []} communities={communities} itemTypes={itemTypes} initialFilters={filters} />
      <Footer />
    </>
  );
}
