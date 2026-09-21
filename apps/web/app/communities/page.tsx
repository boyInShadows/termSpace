import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMarketplaceCommunities } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";

export const metadata: Metadata = { title: "Communities" };
export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const [locale, communities] = await Promise.all([
    getLocale(),
    getMarketplaceCommunities().catch((error) => { console.error("Community directory load failed", error); return []; }),
  ]);
  const fa = locale === "fa";
  return <>
    <Header />
    <main className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">{fa ? "جامعه‌های ترم‌اسپیس" : "TermSpace communities"}</p>
        <h1 className="editorial mt-3 text-5xl">{fa ? "ابزارها را در بستر مناسب پیدا کنید" : "Find tools in their working context"}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{fa ? "هر جامعه یک فضای انتشار مدیریت‌شده پیرامون یک سکو یا زیست‌بوم است. حضور یک فهرست در جامعه به‌طور مستقل بررسی می‌شود و به‌معنای تأیید رسمی سکو نیست." : "Each community is a moderated publishing space around a platform or ecosystem. Placement is reviewed independently and does not imply official platform endorsement."}</p>
      </div>
      {communities.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {communities.map((community) => <article key={community.slug} className="flex h-full flex-col rounded-xl border bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{community.primaryPlatform}</p>
          <h2 className="editorial mt-3 text-2xl">{fa ? community.nameFa ?? community.nameEn : community.nameEn}</h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{fa ? community.descriptionFa ?? community.descriptionEn : community.descriptionEn}</p>
          <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4 text-sm">
            <span>{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(community.products ?? 0)} {fa ? "فهرست تأییدشده" : "approved listings"}</span>
            <Link href={`/communities/${community.slug}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline">{fa ? "مشاهده" : "Browse"}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </article>)}
      </div> : <p role="status" className="mt-10 rounded-xl border bg-surface p-6 text-muted-foreground">{fa ? "در حال حاضر جامعهٔ فعالی برای نمایش وجود ندارد." : "There are no active communities to display."}</p>}
    </main>
    <Footer />
  </>;
}
