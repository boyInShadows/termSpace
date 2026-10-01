import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import {
  ApiError,
  request,
  getDiscoveryOptions,
  getMarketplaceItemTypes,
  getProducts,
} from "@/lib/api";
import type { Community } from "@/lib/types";
import { getLocale } from "@/lib/serverLocale";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fa = (await getLocale()) === "fa";
  let community: Community;
  try {
    community = (
      await request<{ data: Community }>(
        `/api/marketplace/communities/${encodeURIComponent(slug)}`,
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const filters = { community: slug, page: 1, limit: 12 };
  const [initial, options, itemTypes] = await Promise.all([
    getProducts(filters),
    getDiscoveryOptions(),
    getMarketplaceItemTypes(),
  ]);
  return (
    <>
      <Header />
      <section className="container-page pt-10">
        <h1 className="editorial text-5xl">
          {fa ? (community.nameFa ?? community.nameEn) : community.nameEn}
        </h1>
        <p className="mt-4">
          {fa
            ? (community.descriptionFa ?? community.descriptionEn)
            : community.descriptionEn}
        </p>
        <h2 className="mt-6 font-semibold">
          {fa ? "قوانین" : "Community rules"}
        </h2>
        <p className="whitespace-pre-wrap">
          {fa ? (community.rulesFa ?? community.rulesEn) : community.rulesEn}
        </p>
        <h2 className="mt-4 font-semibold">
          {fa ? "راهنمای ارسال" : "Submission guidance"}
        </h2>
        <p className="whitespace-pre-wrap">
          {fa
            ? (community.submissionGuidanceFa ?? community.submissionGuidanceEn)
            : community.submissionGuidanceEn}
        </p>
        {community.state === "ARCHIVED" && (
          <p role="status" className="mt-6">
            {fa
              ? "این جامعه بایگانی شده است."
              : "This community is archived. Its listings remain available through their canonical pages."}
          </p>
        )}
      </section>
      {community.state === "ACTIVE" && (
        <DiscoveryExperience
          initial={initial}
          options={options}
          itemTypes={itemTypes}
          initialFilters={filters}
          fixedCommunity
        />
      )}
      <Footer />
    </>
  );
}
