import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReleaseSelectionProvider, SelectedRelease } from "@/features/product/release-selection";
import { ProductFacts, ProductHeader } from "@/features/product/title-block";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/features/product/product-actions";
import { CompatibilityBadges, CreatorIdentity, Rating } from "@/components/marketplace/product-parts";
import { ProductCard } from "@/components/marketplace/product-card";
import { ManifestTable, type ManifestRow } from "@/components/catalog/manifest-table";
import { VersionPicker } from "@/components/catalog/version-picker";
import { ApiError, getProduct } from "@/lib/api";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { ReleaseProvenance, provenanceTitle } from "@/features/product/release-provenance";
import { ReviewComposer } from "@/features/product/review-composer";
import { pageAlternates } from "@/lib/alternates";
import { getLocale } from "@/lib/serverLocale";
import type { ProductDetail } from "@/lib/types";
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

/** The page's own strings. The i18n split (plan P7) will move these into lib/i18n. */
function labels(fa: boolean) {
  return fa
    ? {
        explore: "کاوش", verified: "تأییدشده", notReviewed: "هنوز بررسی نشده", safety: "بررسی ایمنی", pending: "در انتظار بررسی",
        notDeclared: "اعلام نشده", scope: "دامنهٔ دسترسی", notStated: "ذکر نشده", licence: "مجوز", uses: "استفاده",
        free: "رایگان برای همه", sharing: "اشتراک‌گذاری جامعه", whatItDoes: "چه می‌کند", manifest: "مانیفست",
        useCases: "کاربردهای مناسب", included: "محتویات", example: "نمونهٔ ورودی و خروجی", input: "ورودی", output: "بخشی از خروجی",
        reviews: "نقدها", noReviews: "هنوز نقدی ثبت نشده است.", verifiedUse: "استفادهٔ تأییدشده", worksWith: "سازگار با", models: "مدل‌ها",
        creator: "دربارهٔ سازنده", resources: "منبع", resource: "منبع", followers: "دنبال‌کننده", related: "منابع مرتبط", keepBuilding: "ادامه دهید",
        manifestLabels: { type: "نوع", platforms: "پلتفرم‌ها", models: "مدل‌ها", permissions: "دسترسی‌ها", requirements: "پیش‌نیازها", license: "مجوز", reviewed: "بررسی", version: "نسخه", updated: "به‌روزرسانی", package: "بسته", updates: "سیاست به‌روزرسانی" },
        passed: "بررسی بسته انجام شد", notYet: "هنوز توسط تیم بررسی نشده", files: "فایل",
        installNote: "مراحل دقیق نصب به نسخه‌ای که به کتابخانهٔ خود اضافه می‌کنید متصل است.",
      }
    : {
        explore: "Explore", verified: "Verified", notReviewed: "Not yet reviewed", safety: "safety reviewed", pending: "review pending",
        notDeclared: "Not declared", scope: "permission scope", notStated: "Not stated", licence: "licence", uses: "uses",
        free: "Free for everyone", sharing: "Community sharing", whatItDoes: "What it does", manifest: "Manifest",
        useCases: "Ideal use cases", included: "What’s included", example: "Example input and output", input: "Input", output: "Output excerpt",
        reviews: "Reviews", noReviews: "No reviews yet.", verifiedUse: "Verified use", worksWith: "Works with", models: "Models",
        creator: "About the creator", resources: "resources", resource: "resource", followers: "followers", related: "Related listings", keepBuilding: "Keep building",
        manifestLabels: { type: "type", platforms: "platforms", models: "models", permissions: "permissions", requirements: "requirements", license: "license", reviewed: "reviewed", version: "version", updated: "updated", package: "package", updates: "updates" },
        passed: "Package scan passed", notYet: "Not yet reviewed by the team", files: "files",
        installNote: "Exact installation steps are tied to the release you add to your library.",
      };
}

type Labels = ReturnType<typeof labels>;

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 text-base leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function manifestRows(product: ProductDetail, l: Labels, locale: Locale): ManifestRow[] {
  const m = l.manifestLabels;
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(product.updatedAt));
  const rows: ManifestRow[] = [
    { key: "type", label: m.type, value: copy[locale].productCard.types[product.type] ?? product.type },
    { key: "platforms", label: m.platforms, value: product.compatibility.platforms.join(" · ") || l.notStated },
    { key: "permissions", label: m.permissions, value: product.permissions ?? l.notDeclared, tone: product.permissions ? undefined : "attention" },
    { key: "requirements", label: m.requirements, value: product.requirements ?? l.notStated },
    { key: "license", label: m.license, value: product.license ?? l.notStated },
    { key: "reviewed", label: m.reviewed, value: product.verified ? l.passed : l.notYet, tone: product.verified ? "verified" : "attention" },
    { key: "version", label: m.version, value: <span className="font-mono" dir="ltr">v{product.version}</span> },
    { key: "updated", label: m.updated, value: date },
  ];
  if (product.compatibility.models.length > 0) rows.splice(2, 0, { key: "models", label: m.models, value: product.compatibility.models.join(" · ") });
  if (product.packageFileCount && product.packageSizeBytes) {
    rows.push({ key: "package", label: m.package, value: `${product.packageFileCount} ${l.files} · ${Math.round(product.packageSizeBytes / 1024)} KB` });
  }
  if (product.updatesPolicy) rows.push({ key: "updates", label: m.updates, value: product.updatesPolicy });
  return rows;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const fa = locale === "fa";
  const l = labels(fa);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(product) }} />
      <Header />
      <main className="container-page py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href={localePath("/explore", locale)} className="-my-2 inline-block py-2 hover:text-foreground">{l.explore}</Link> / {typeLabel} /{" "}
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
              </div>
            </aside>

            <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
              <ProductFacts product={product} locale={locale} />
                <Section title={l.whatItDoes}>
                  <p className="ts-bidi">{product.description}</p>
                  {product.benefits.length > 0 && (
                    <ul className="mt-5 space-y-2 text-foreground">
                      {product.benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-3 text-sm">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 border border-foreground/70" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={l.manifest} id="manifest">
                  <ManifestTable rows={manifestRows(product, l, locale)} />
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
                          <h3 className="font-semibold text-foreground">{useCase.title}</h3>
                          <p className="mt-1 text-sm">{useCase.description}</p>
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
                          <span className="text-sm">{file.description}</span>
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
                          <p className="text-lg font-bold text-foreground">{product.exampleOutputTitle}</p>
                          <p className="mt-2 text-sm">{product.exampleOutputBody}</p>
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
                          <p className="mt-3 max-w-2xl">{review.body}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title={l.worksWith}>
                  <CompatibilityBadges compatibility={product.compatibility} limit={8} />
                  {product.compatibility.models.length > 0 && (
                    <p className="mt-3 text-xs">{l.models}: {product.compatibility.models.join(", ")}</p>
                  )}
                </Section>

                <Section title={l.creator}>
                  <div className="border border-border p-4">
                    <CreatorIdentity creator={product.creator} />
                    <p className="mt-4 max-w-2xl">{product.creator.bio}</p>
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
