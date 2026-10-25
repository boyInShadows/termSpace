import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ReleaseSelectionProvider, SelectedRelease } from "@/features/product/release-selection";
import { ProductFacts, ProductHeader } from "@/features/product/title-block";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/features/product/product-actions";
import { CreatorIdentity, Rating } from "@/components/marketplace/product-parts";
import { ProductCard } from "@/components/marketplace/product-card";
import { VersionPicker } from "@/components/catalog/version-picker";
import { ApiError, getProduct } from "@/lib/api";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { Fact } from "@/features/product/release-facts";
import { ReleaseProvenance, provenanceTitle } from "@/features/product/release-provenance";
import { ReviewComposer } from "@/features/product/review-composer";
import { pageAlternates } from "@/lib/alternates";
import { productPageLabels, type ProductPageLabels } from "@/lib/i18n/product-page";
import { getLocale } from "@/lib/serverLocale";
import type { ProductDetail } from "@/lib/types";
import { ListingReport } from "@/features/reporting/listing-report";
import { SITE_URL } from "@/lib/site";
import { formatNumber, intlLocale } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await getLocale();
  const t = copy[locale];
  let product: ProductDetail;
  try {
    product = await getProduct((await params).slug);
  } catch {
    return { title: t.titles.listingNotFound };
  }
  const platform = product.compatibility.platforms[0];
  const typeLabel = t.productCard.types[product.type] ?? product.type;
  // The root layout's title template appends " · termspace".
  const path = `/products/${product.slug}`;
  const values = { "{name}": product.name, "{type}": typeLabel, "{platform}": platform ?? "" };
  const template = platform ? t.titles.productFor : t.titles.product;
  return {
    title: template.replace(/\{(name|type|platform)\}/g, (token) => values[token as keyof typeof values]),
    description: product.outcome,
    alternates: pageAlternates(path, locale),
    openGraph: { title: product.name, description: product.outcome, type: "website", url: localePath(path, locale) },
  };
}

/**
 * schema.org SoftwareApplication, so search results can show the rating and
 * that it is free. `<` is escaped: listing text is creator-supplied, and must
 * not be able to close the script element.
 */
function structuredData(product: ProductDetail) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.outcome,
    url: `${SITE_URL}/products/${product.slug}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: product.compatibility.platforms.join(", ") || undefined,
    softwareVersion: product.version,
    dateModified: product.updatedAt,
    author: { "@type": "Person", name: product.creator.name },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating:
      product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 }
        : undefined,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}


function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 text-base leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

/** What the key-facts list does not already say. */
function detailRows(product: ProductDetail, l: ProductPageLabels, locale: Locale) {
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(product.updatedAt));
  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: "requirements", label: l.requirements, value: product.requirements ?? l.notStated },
    { key: "updated", label: l.updated, value: date },
  ];
  if (product.packageFileCount && product.packageSizeBytes) {
    rows.push({ key: "package", label: l.package, value: `${product.packageFileCount} ${l.files} · ${Math.round(product.packageSizeBytes / 1024)} KB` });
  }
  if (product.updatesPolicy) rows.push({ key: "updates", label: l.updatesPolicy, value: product.updatesPolicy });
  return rows;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const locale = await getLocale();
  const fa = locale === "fa";
  const l = productPageLabels(fa);
  let product: ProductDetail;
  try {
    product = await getProduct((await params).slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const typeLabel = copy[locale].productCard.types[product.type] ?? product.type;
  const numbers = intlLocale(locale);

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(product) }} />
      <main id="content" tabIndex={-1} className="container-page py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href={localePath("/explore", locale)} className="-my-3.5 inline-block py-3.5 hover:text-foreground">{l.explore}</Link> / {typeLabel} /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Below lg the order is header, the add controls, then the facts and
            sections, so Add sits near the top; from lg the controls are the
            sticky right rail beside them. */}
        <ReleaseSelectionProvider slug={product.slug} versions={product.versions} release={product.release}>
          <div className="mt-8 grid gap-y-10 lg:grid-cols-[1fr_20rem] lg:gap-x-16">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <ProductHeader product={product} typeLabel={typeLabel} locale={locale} />
            </div>

            <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="space-y-4 lg:sticky lg:top-24">
                {product.versions.length > 0 && <VersionPicker />}
                <ProductActions product={product} />
                <p className="text-xs leading-5 text-muted-foreground">{l.installNote}</p>
                <ListingReport slug={product.slug} />
              </div>
            </aside>

            <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
              <ProductFacts product={product} locale={locale} />
                <Section title={l.whatItDoes}>
                  <p className="ts-bidi max-w-2xl">{product.description}</p>
                  {product.benefits.length > 0 && (
                    <ul className="mt-5 space-y-2 text-foreground">
                      {product.benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-3 text-sm">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 border border-foreground/70" />
                          <span className="ts-bidi">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={l.details} id="details">
                  <dl className="border-b border-border">
                    {detailRows(product, l, locale).map((row) => <Fact key={row.key} label={row.label}>{row.value}</Fact>)}
                  </dl>
                </Section>

                {product.release && (
                  <Section title={provenanceTitle(locale)} id="provenance">
                    <SelectedRelease view="provenance" slug={product.slug} locale={locale}>
                      <ReleaseProvenance release={product.release} slug={product.slug} locale={locale} />
                    </SelectedRelease>
                  </Section>
                )}

                {(product.useCases ?? []).length > 0 && (
                  <Section title={l.useCases}>
                    <div className="grid divide-y divide-border border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      {(product.useCases ?? []).map((useCase) => (
                        <div key={useCase.title} className="p-4">
                          <h3 className="ts-bidi font-semibold text-foreground">{useCase.title}</h3>
                          <p className="ts-bidi mt-1 text-sm">{useCase.description}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {(product.includedFiles ?? []).length > 0 && (
                  <Section title={l.included}>
                    <div className="divide-y divide-border border border-border">
                      {(product.includedFiles ?? []).map((file) => (
                        <div className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr]" key={file.name}>
                          <code className="font-mono text-xs text-foreground" dir="ltr">{file.name}</code>
                          <span className="ts-bidi text-sm">{file.description}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {product.exampleInput && (
                  <Section title={l.example}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="eyebrow">{l.input}</p>
                        <pre className="mt-2 whitespace-pre-wrap border border-border bg-surface p-4 font-mono text-xs leading-6">{product.exampleInput}</pre>
                      </div>
                      <div>
                        <p className="eyebrow">{l.output}</p>
                        <div className="mt-2 border border-foreground/60 p-4">
                          <p className="ts-bidi text-lg font-bold text-foreground">{product.exampleOutputTitle}</p>
                          <p className="ts-bidi mt-2 text-sm">{product.exampleOutputBody}</p>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                <Section title={`${l.reviews} (${formatNumber(product.reviewCount, locale)})`} id="reviews">
                  <ReviewComposer slug={product.slug} />
                  {product.reviews.length === 0 ? (
                    <p>{l.noReviews}</p>
                  ) : (
                    <div className="space-y-6">
                      {product.reviews.map((review) => (
                        <article key={review.id} className="border-b pb-6">
                          <div className="flex justify-between gap-3">
                            <div>
                              <strong className="text-sm text-foreground">{review.author}</strong>
                              <p className="mt-1 text-xs">
                                <Rating rating={review.rating} /> ·{" "}
                                {new Intl.DateTimeFormat(numbers, { dateStyle: "medium" }).format(new Date(review.createdAt))}
                              </p>
                            </div>
                            {review.verifiedPurchase && <Badge variant="success">{l.verifiedUse}</Badge>}
                          </div>
                          <p className="ts-bidi mt-3 max-w-2xl">{review.body}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title={l.creator}>
                  <div>
                    <CreatorIdentity creator={product.creator} href={localePath(`/creators/${product.creator.handle}`, locale)} verifiedLabel={copy[locale].productCard.verifiedCreator} />
                    <p className="ts-bidi mt-4 max-w-2xl">{product.creator.bio}</p>
                    <p className="mt-4 text-xs font-semibold text-foreground">
                      {product.creator.products} {product.creator.products === 1 ? l.resource : l.resources} · {formatNumber(product.creator.followers, locale)} {l.followers}
                    </p>
                  </div>
                </Section>
            </div>
          </div>
        </ReleaseSelectionProvider>

        {product.related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-2xl font-bold tracking-tight">{l.related}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {product.related.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
