import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getMarketplaceCommunities, getMarketplaceHome, getMarketplaceItemTypes, getProducts } from "@/lib/api";
import { filtersFromParams, type RawSearchParams } from "@/lib/discovery-url";
import { pageAlternates } from "@/lib/alternates";
import { getLocale } from "@/lib/serverLocale";
import { copy } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].explore, alternates: pageAlternates("/explore", locale) };
}
export default async function ExplorePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const filters = filtersFromParams(raw);
  const [initialState, home, communities, itemTypes] = await Promise.all([
    getProducts(filters)
      .then((result) => ({ result, error: false }))
      .catch(() => ({ result: { data: [], meta: { page: filters.page ?? 1, limit: filters.limit ?? 12, total: 0, totalPages: 0 } }, error: true })),
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
