import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/siteMetadata";

const staticPaths = ["/", "/blog", "/editions", "/topics", "/resources"];

export const dynamic = "force-dynamic";

function entriesForPath(path: string, lastModified?: string | Date): MetadataRoute.Sitemap {
  const englishUrl = new URL(path, SITE_URL).toString();
  const persianUrl = new URL(`/fa${path === "/" ? "" : path}`, SITE_URL).toString();

  return [{
    url: englishUrl,
    lastModified,
    alternates: {
      languages: {
        en: englishUrl,
        fa: persianUrl,
      },
    },
  }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticPaths.flatMap((path) => entriesForPath(path));

  try {
    const articles: Awaited<ReturnType<typeof api.listArticles>>["data"] = [];
    let page = 1;
    do {
      const result = await api.listArticles({ page, limit: 200, published: true });
      articles.push(...result.data);
      if (!result.meta.hasNextPage) break;
      page += 1;
    } while (page <= 1000);

    const [categories, tags, series, editions, resources] = await Promise.all([
      api.listCategories(),
      api.listTags(),
      api.listSeries(),
      api.listEditions(),
      api.listResources(),
    ]);

    entries.push(
      ...articles.flatMap((article) => entriesForPath(`/blog/${article.slug}`, article.updatedAt)),
      ...categories.data.flatMap((category) => entriesForPath(`/blog/category/${category.slug}`)),
      ...tags.data.flatMap((tag) => entriesForPath(`/blog/tag/${tag.slug}`)),
      ...series.data.flatMap((item) => entriesForPath(`/blog/series/${item.slug}`)),
      ...editions.data.flatMap((edition) => entriesForPath(`/editions/${edition.slug}`, edition.updatedAt)),
      ...resources.data.flatMap((resource) => entriesForPath(`/resources/${resource.slug}`, resource.updatedAt)),
    );
  } catch (error) {
    console.error("Failed to include dynamic content in sitemap", error);
  }

  return entries;
}
