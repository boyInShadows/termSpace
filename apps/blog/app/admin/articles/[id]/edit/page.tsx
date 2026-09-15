import { api } from "@/lib/api";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { RevisionHistory } from "@/components/admin/RevisionHistory";

export const revalidate = 0;

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const cookie = await getAdminCookieHeader();
  const [articleRes, authorsRes, categoriesRes, tagsRes, seriesRes, mediaRes, revisionsRes] = await Promise.all([
    api.getArticleById(id, { cookie }),
    api.listAuthors(),
    api.listCategories(),
    api.listTags(),
    api.listSeries(),
    api.listMedia({ cookie }),
    api.listArticleRevisions(id, { cookie }),
  ]);

  const article = articleRes.data;

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">Edit article</h2>
      <ArticleForm authors={authorsRes.data} categories={categoriesRes.data} tags={tagsRes.data} series={seriesRes.data} media={mediaRes.data} article={article} />
      <RevisionHistory articleId={article.id} initialRevisions={revisionsRes.data} />
    </div>
  );
}
