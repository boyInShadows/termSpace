import Link from "next/link";
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
import type { Creator } from "@/lib/types";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const locale = await getLocale();
  let creator: Creator & {
    collections: Array<{
      slug: string;
      title: string;
      description: string;
      count: number;
    }>;
  };
  try {
    creator = (
      await request<{ data: typeof creator }>(
        `/api/marketplace/creators/${encodeURIComponent(handle)}`,
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const filters = { creator: handle, page: 1, limit: 12 };
  const [initial, options, itemTypes] = await Promise.all([
    getProducts(filters),
    getDiscoveryOptions(),
    getMarketplaceItemTypes(),
  ]);
  return (
    <>
      <Header />
      <section className="container-page pt-10">
        <h1 className="editorial text-5xl">{creator.name}</h1>
        <p className="mt-3">@{creator.handle}</p>
        <p className="mt-4">{creator.bio}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          {creator.collections.map((collection) => (
            <Link
              key={collection.slug}
              className="rounded-lg border p-4"
              href={localePath(
                `/creators/${handle}/collections/${collection.slug}`,
                locale,
              )}
            >
              {collection.title} ({collection.count})
            </Link>
          ))}
        </div>
      </section>
      <DiscoveryExperience
        initial={initial}
        options={options}
        itemTypes={itemTypes}
        initialFilters={filters}
      />
      <Footer />
    </>
  );
}
