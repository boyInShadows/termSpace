import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/product-card";
import { ApiError, getMarketplaceCreator } from "@/lib/api";
import { pageAlternates } from "@/lib/alternates";
import { filtersFromParams, type RawSearchParams } from "@/lib/discovery-url";
import { formatNumber } from "@/lib/format";
import { localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";
import { creatorProfileCopy } from "@/features/creators/profile-copy";

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  const result = await getMarketplaceCreator(handle).catch(() => null);
  return { title: result?.data.creator.name ?? creatorProfileCopy[locale].title, description: result?.data.creator.bio, alternates: pageAlternates(`/creators/${encodeURIComponent(result?.data.creator.handle ?? handle)}`, locale), robots: result ? undefined : { index: false, follow: true } };
}

export default async function CreatorPage({ params, searchParams }: Props) {
  const [{ handle }, raw, locale] = await Promise.all([params, searchParams, getLocale()]);
  const text = creatorProfileCopy[locale];
  const page = filtersFromParams(raw).page ?? 1;
  const path = localePath(`/creators/${encodeURIComponent(handle)}`, locale);
  const pageHref = (next: number) => next === 1 ? path : `${path}?page=${next}`;
  let result;
  try {
    result = await getMarketplaceCreator(handle, page);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    let reason = text.loadError;
    if (error instanceof ApiError) {
      if (error.status === 429) reason = text.rateLimited;
      else if (error.status === 0) reason = text.offline;
      else if (error.status === 504) reason = text.timeout;
      else if (error.status >= 500) reason = text.unavailable;
      else reason = error.message;
    }
    return <><main id="content" tabIndex={-1} className="container-page py-12">
      <h1 className="text-2xl font-semibold">{text.loadError}</h1>
      <p role="alert" className="mt-3 text-muted-foreground">{reason}</p>
      <a href={pageHref(page)} className={buttonVariants({ variant: "outline", className: "mt-6" })}>{text.retry}</a>
    </main><Footer /></>;
  }
  const { creator, products } = result.data;
  const { total, totalPages } = result.meta;
  if (page > Math.max(1, totalPages)) redirect(pageHref(Math.max(1, totalPages)));

  return <>
    <main id="content" tabIndex={-1} className="container-page py-8 sm:py-12">
      <Link href={localePath("/explore", locale)} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">{text.back}</Link>
      <header className="mt-6 border-b border-border-strong pb-8">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar initials={creator.initials} className="size-14 text-lg" />
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold sm:text-4xl"><bdi>{creator.name}</bdi></h1>
            <p className="mt-2 break-all text-sm text-muted-foreground"><bdi dir="ltr">@{creator.handle}</bdi></p>
          </div>
        </div>
        {creator.verified && <p className="mt-4 flex items-center gap-2 text-sm"><BadgeCheck className="size-4 text-primary" aria-hidden="true" />{text.verified}</p>}
        <p className="ts-bidi mt-5 max-w-2xl whitespace-pre-wrap break-words leading-7 text-muted-foreground">{creator.bio}</p>
      </header>
      <section aria-labelledby="creator-listings-title" className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="creator-listings-title" className="text-xl font-semibold">{text.listings}</h2>
          <span className="font-mono text-sm tabular-nums">{formatNumber(total, locale)}</span>
        </div>
        {products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p role="status" className="border border-border p-6 text-muted-foreground">{text.empty}</p>}
        {totalPages > 1 && <nav aria-label={text.pagination} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          {page > 1 ? <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline" })}>{text.previous}</Link> : <span />}
          <p className="text-sm text-muted-foreground">{text.page.replace("{page}", formatNumber(page, locale)).replace("{total}", formatNumber(totalPages, locale))}</p>
          {page < totalPages ? <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline" })}>{text.next}</Link> : <span />}
        </nav>}
      </section>
    </main>
    <Footer />
  </>;
}
