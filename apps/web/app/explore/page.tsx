import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getMarketplaceCommunities, getMarketplaceHome, getMarketplaceItemTypes, getProducts } from "@/lib/api";
import { discoveryHref, filtersFromParams, toSearchParams, type RawSearchParams } from "@/lib/discovery-url";
import { localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";
export const metadata: Metadata = { title: "Explore" };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [raw, locale] = await Promise.all([searchParams, getLocale()]);
  const filters = filtersFromParams(raw);
  const [initialState, home, communities, itemTypes] = await Promise.all([
    getProducts(filters)
      .then((result) => ({ result, error: false }))
      .catch(() => ({ result: { data: [], meta: { page: filters.page ?? 1, limit: filters.limit ?? 12, total: 0, totalPages: 0 } }, error: true })),
    getMarketplaceHome().catch(() => null),
    getMarketplaceCommunities().catch(() => []),
    getMarketplaceItemTypes().catch(() => []),
  ]);
  const { meta } = initialState.result;
  const pageHref = (page: number) => discoveryHref(localePath("/explore", locale), toSearchParams(raw), { page });
  return (
    <>
      {/* React hoists these into <head>: the pagination, for crawlers. */}
      {meta.page > 1 && <link rel="prev" href={pageHref(meta.page - 1)} />}
      {meta.page < meta.totalPages && <link rel="next" href={pageHref(meta.page + 1)} />}
      <Header />
      <DiscoveryExperience initial={initialState.result} initialError={initialState.error} categories={home?.categories ?? []} platforms={home?.platforms ?? []} communities={communities} itemTypes={itemTypes} initialFilters={filters} />
      <Footer />
    </>
  );
}
