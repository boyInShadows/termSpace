import { api } from "@/lib/api";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { EditionManager } from "@/components/admin/EditionManager";

export const revalidate = 0;
export default async function AdminEditionsPage() {
  const cookie = await getAdminCookieHeader();
  const [editions, articles] = await Promise.all([api.listEditions({ admin: true, cookie }), api.listAllArticles({ cookie })]);
  return <div><h2 className="mb-2 font-serif text-2xl font-semibold">Editorial editions</h2><p className="mb-6 text-sm text-ink-soft">Package selected stories into numbered, themed releases.</p><EditionManager initialEditions={editions.data} articles={articles.data} /></div>;
}
