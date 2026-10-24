import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { ApiError, getMarketplaceCommunities, getMarketplaceHome, getMarketplaceItemTypes, getProducts } from "@/lib/api";
import { discoveryHref, filtersFromParams, toSearchParams, type RawSearchParams } from "@/lib/discovery-url";
import { localePath } from "@/lib/i18n";
import { pageAlternates } from "@/lib/alternates";
import { visitorHeaders } from "@/lib/clientIp";
import { getLocale } from "@/lib/serverLocale";
import { copy } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].explore, alternates: pageAlternates("/explore", locale) };
}
export default async function ExplorePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const locale = await getLocale();
  const raw = await searchParams;
  const filters = filtersFromParams(raw);
  // Only searches are rate-limited per visitor; leave the shared catalogue cache alone.
  const forward = filters.q ? await visitorHeaders() : undefined;
  const [initialState, home, communities, itemTypes] = await Promise.all([
    getProducts(filters, undefined, forward)
      .then((result) => ({ result, error: false, rejected: false, rateLimited: false }))
      .catch((failure: unknown) => ({
        result: { data: [], meta: { page: filters.page ?? 1, limit: filters.limit ?? 12, total: 0, totalPages: 0 } },
        error: true,
        // 400: the URL asked for a filter the API does not know, not an outage.
        rejected: failure instanceof ApiError && failure.status === 400,
        rateLimited: failure instanceof ApiError && failure.status === 429,
      })),
    getMarketplaceHome().catch(() => null),
    getMarketplaceCommunities().catch(() => []),
    getMarketplaceItemTypes().catch(() => []),
  ]);
  const { meta } = initialState.result;
  const pageHref = (page: number) => discoveryHref(localePath("/explore", locale), toSearchParams(raw), { page });
  // A shared link with a filter the API rejects keeps its search and drops the
  // rest. Without other params to drop, the 400 is the search itself and
  // redirecting again would loop, so that case falls through to the banner.
  if (initialState.rejected && Object.keys(raw).some((key) => key !== "q")) {
    redirect(discoveryHref(localePath("/explore", locale), "", { q: filters.q }));
  }
  // A page past the end (a stale link) lands on the last page, not an empty one.
  if (!initialState.error && meta.total > 0 && meta.page > meta.totalPages) redirect(pageHref(meta.totalPages));
  return (
    <>
      <DiscoveryExperience initial={initialState.result} initialError={initialState.error} rateLimited={initialState.rateLimited} categories={home?.categories ?? []} platforms={home?.platforms ?? []} communities={communities} itemTypes={itemTypes} initialFilters={filters} />
      <Footer />
    </>
  );
}
