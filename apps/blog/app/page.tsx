import { api } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { EditionCover } from "@/components/EditionCover";
import { ArticleCard } from "@/components/ArticleCard";
import { CategoryCard } from "@/components/CategoryCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Newsletter } from "@/components/Newsletter";
import { EmptyState } from "@/components/EmptyState";
import { getLocale } from "@/lib/serverLocale";
import { copy, localePath } from "@/lib/i18n";
import { localizeEditionFa } from "@/lib/faContent";

export const revalidate = 60;

export default async function HomePage() {
  const locale = await getLocale();
  const t = copy[locale];
  const [articlesRes, categoriesRes, currentEditionRes] = await Promise.all([
    api.listArticles({ limit: 6, published: true }),
    api.listCategories(),
    api.getCurrentEdition(),
  ]);

  const articles = articlesRes.data;
  const categories = categoriesRes.data;
  const currentEdition = currentEditionRes.data && locale === "fa" ? localizeEditionFa(currentEditionRes.data) : currentEditionRes.data;

  return (
    <>
      <Hero />

      {currentEdition && (
        <section aria-label={locale === "fa" ? "شمارهٔ تازه" : "Current edition"}>
          <EditionCover edition={currentEdition} locale={locale} />
        </section>
      )}

      {articles.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <SectionHeading eyebrow={locale === "fa" ? "تازه‌ها" : "Latest"} title={locale === "fa" ? "نوشته‌های تازه" : "Recent writing"} href={localePath("/blog", locale)} linkLabel={locale === "fa" ? "مشاهده همه" : "View all"} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <SectionHeading eyebrow={t.topics} title={locale === "fa" ? "مرور بر اساس موضوع" : "Browse by subject"} href={localePath("/blog", locale)} linkLabel={locale === "fa" ? "مشاهده همه" : "View all"} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <EmptyState
            title={locale === "fa" ? "هنوز مقاله‌ای منتشر نشده" : "No articles yet"}
            description={locale === "fa" ? "به‌زودی دوباره سر بزنید؛ مجله در حال نوشته‌شدن است." : "Check back soon — the journal is being written."}
          />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <SectionHeading
          eyebrow={t.resources}
          title={locale === "fa" ? "قالب‌های آماده برای پروژهٔ بعدی شما" : "Templates ready for your next project"}
          href={localePath("/resources", locale)}
          linkLabel={locale === "fa" ? "مرور فایل‌ها" : "Browse files"}
        />
        <p className="mt-4 max-w-2xl text-ink-soft">
          {locale === "fa" ? "قالب‌های کاربردی مارک‌داون را برای برنامه‌ریزی، بازبینی کد و مرور رخدادها بررسی و دریافت کنید." : "Review and download practical Markdown templates for planning, code review, and incident learning."}
        </p>
      </section>

      <Newsletter />
    </>
  );
}
