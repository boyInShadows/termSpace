import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getDiscoveryOptions } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export default async function CommunitiesPage() {
  const [options, locale] = await Promise.all([
    getDiscoveryOptions(),
    getLocale(),
  ]);
  const fa = locale === "fa";
  return (
    <>
      <Header />
      <main className="container-page py-10">
        <h1 className="editorial text-5xl">
          {fa ? "جامعه‌ها" : "Communities"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {fa
            ? "فضاهای اشتراک‌گذاری مستقل با نظارت ترم‌اسپیس"
            : "Independent sharing spaces moderated by TermSpace."}
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {options.communities.map((community) => (
            <Link
              key={community.slug}
              href={localePath(`/communities/${community.slug}`, locale)}
              className="rounded-xl border p-6"
              style={{
                borderTopColor: community.accentColor,
                borderTopWidth: 4,
              }}
            >
              <h2 className="text-xl font-semibold">
                {fa ? (community.nameFa ?? community.nameEn) : community.nameEn}
              </h2>
              <p className="mt-3">
                {fa
                  ? (community.descriptionFa ?? community.descriptionEn)
                  : community.descriptionEn}
              </p>
            </Link>
          ))}
        </div>
        {!options.communities.length && (
          <p role="status" className="mt-8">
            {fa ? "هنوز جامعه فعالی وجود ندارد." : "No active communities yet."}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
