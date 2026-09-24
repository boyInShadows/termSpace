import type { MetadataRoute } from "next";
import { getMarketplaceCommunities, getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import type { Product } from "@/lib/types";

export const revalidate = 3600;

const PAGE_SIZE = 48;
/** A ceiling on listing pages walked per build of the sitemap. */
const MAX_PAGES = 100;
const DAY_MS = 86_400_000;

function entry(path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    alternates: { languages: { en: `${SITE_URL}${path}`, fa: `${SITE_URL}/fa${path === "/" ? "" : path}` } },
    ...extra,
  };
}

/** How often a listing changes, read from how recently it last did. */
function changeFrequency(updatedAt: string, now: number): MetadataRoute.Sitemap[number]["changeFrequency"] {
  const age = now - Date.parse(updatedAt);
  if (age < 7 * DAY_MS) return "daily";
  if (age < 30 * DAY_MS) return "weekly";
  return "monthly";
}

async function allListings(): Promise<Product[]> {
  const listings: Product[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getProducts({ page, limit: PAGE_SIZE, sort: "newest" });
    listings.push(...result.data);
    if (page >= result.meta.totalPages) break;
  }
  return listings;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = Date.now();
  const [listings, communities] = await Promise.all([
    allListings().catch((error) => {
      console.error("Sitemap: listings unavailable", error);
      return [];
    }),
    getMarketplaceCommunities().catch(() => []),
  ]);
  return [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/explore", { changeFrequency: "daily", priority: 0.9 }),
    entry("/communities", { changeFrequency: "weekly", priority: 0.6 }),
    ...communities.map((community) => entry(`/communities/${community.slug}`, { changeFrequency: "weekly", priority: 0.6 })),
    ...listings.map((listing) =>
      entry(`/products/${listing.slug}`, {
        lastModified: listing.updatedAt,
        changeFrequency: changeFrequency(listing.updatedAt, now),
        priority: 0.8,
      }),
    ),
  ];
}
