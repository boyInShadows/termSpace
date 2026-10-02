import { api } from "@/lib/api";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { NewsletterManager } from "@/components/admin/NewsletterManager";

export const revalidate = 0;

export default async function NewsletterPage() {
  const cookie = await getAdminCookieHeader();
  const [campaigns, articles] = await Promise.all([api.listNewsletterCampaigns({ cookie }), api.listArticles({ published: true, limit: 200 })]);
  return <main><h1 className="mb-6 font-serif text-3xl font-semibold">Newsletter</h1><NewsletterManager initialCampaigns={campaigns.data} articles={articles.data.map(({ id, title }) => ({ id, title }))} /></main>;
}
