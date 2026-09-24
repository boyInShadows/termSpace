import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getMarketplaceCommunities, getMarketplaceCommunity, getMarketplaceHome, getMarketplaceItemTypes } from "@/lib/api";
import type { ProductFilters } from "@/lib/types";
import { filtersFromParams } from "@/lib/discovery-url";
import { getLocale } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMarketplaceCommunity(slug, { page: 1, limit: 1 }).catch(() => null);
  return { title: result?.data.community.nameEn ?? "Community" };
}

export default async function CommunityPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, raw, locale] = await Promise.all([params, searchParams, getLocale()]);
  // The community is the route, not a filter a URL can override.
  const filters: ProductFilters = { ...filtersFromParams(raw), community: slug };
  const [result, home, communities, itemTypes] = await Promise.all([
    getMarketplaceCommunity(slug, filters).catch((error: { status?: number }) => error?.status === 404 ? null : Promise.reject(error)),
    getMarketplaceHome().catch(() => null),
    getMarketplaceCommunities().catch(() => []),
    getMarketplaceItemTypes().catch(() => []),
  ]);
  if (!result) notFound();
  const community = result.data.community;
  const fa = locale === "fa";
  return <>
    <Header />
    <DiscoveryExperience
      initial={{ data: result.data.products, meta: result.meta }}
        categories={home?.categories ?? []}
        platforms={home?.platforms ?? []}
      communities={community.state === "archived" && !communities.some((item) => item.slug === community.slug) ? [...communities, community] : communities}
      itemTypes={itemTypes}
      initialFilters={filters}
      context={{
        eyebrow: fa ? "جامعهٔ ترم‌اسپیس" : "TermSpace community",
        title: fa ? community.nameFa ?? community.nameEn : community.nameEn,
        intro: fa ? community.descriptionFa ?? community.descriptionEn : community.descriptionEn,
        rules: fa ? community.rulesFa ?? community.rulesEn : community.rulesEn,
        archived: community.state === "archived",
      }}
    />
    <Footer />
  </>;
}
