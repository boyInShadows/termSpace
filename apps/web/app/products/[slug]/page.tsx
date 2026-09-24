import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileText, Lock, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/features/product/product-actions";
import { CompatibilityBadges, CreatorIdentity, ProductTypeBadge, Rating } from "@/components/marketplace/product-parts";
import { ProductCard } from "@/components/marketplace/product-card";
import { ManifestTable, type ManifestRow } from "@/components/catalog/manifest-table";
import { TrustChip } from "@/components/catalog/trust-chip";
import { VersionPicker } from "@/components/catalog/version-picker";
import { listingTransitionName } from "@/lib/listing-transition";
import { ApiError, getProduct } from "@/lib/api";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";
import type { ProductDetail } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let product: ProductDetail;
  try {
    product = await getProduct((await params).slug);
  } catch {
    return { title: "Resource" };
  }
  const platform = product.compatibility.platforms[0];
  // The root layout's title template appends " · termspace".
  const path = `/products/${product.slug}`;
  return {
    title: platform ? `${product.name} — ${product.type} for ${platform}` : `${product.name} — ${product.type}`,
    description: product.outcome,
    alternates: { canonical: path, languages: { en: path, fa: `/fa${path}` } },
    openGraph: { title: product.name, description: product.outcome, type: "website", url: path },
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
        creator: "دربارهٔ سازنده", resources: "منبع", followers: "دنبال‌کننده", related: "منابع مرتبط", keepBuilding: "ادامه دهید",
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
        creator: "About the creator", resources: "resources", followers: "followers", related: "Related listings", keepBuilding: "Keep building",
        manifestLabels: { type: "type", platforms: "platforms", models: "models", permissions: "permissions", requirements: "requirements", license: "license", reviewed: "reviewed", version: "version", updated: "updated", package: "package", updates: "updates" },
        passed: "Package scan passed", notYet: "Not yet reviewed by the team", files: "files",
        installNote: "Exact installation steps are tied to the release you add to your library.",
      };
}

type Labels = ReturnType<typeof labels>;

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="border-t border-border py-9">
      <h2 className="editorial text-3xl font-semibold">{title}</h2>
      <div className="mt-5 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function manifestRows(product: ProductDetail, l: Labels, locale: Locale): ManifestRow[] {
  const m = l.manifestLabels;
  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(product.updatedAt));
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
  const numbers = fa ? "fa-IR" : "en-US";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(product) }} />
      <Header />
      <main className="container-page py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href={localePath("/explore", locale)} className="hover:text-foreground">{l.explore}</Link> / {typeLabel} /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_21rem]">
          <div className="min-w-0">
            {/* --- header: the listing card, grown -------------------------- */}
            <header className="pb-9">
              <div className="flex flex-wrap items-center gap-2">
                <ProductTypeBadge type={product.type} label={typeLabel} />
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">v{product.version}</span>
              </div>
              {/* Shares its name with the card title, so the title travels
                  from the card into this header on navigation. */}
              <h1
                className="ts-listing-title editorial mt-5 max-w-3xl text-5xl font-medium leading-none sm:text-6xl"
                style={{ viewTransitionName: listingTransitionName(product.id) }}
                data-listing-header={product.id}
              >
                {product.name}
              </h1>
              <p className="mt-5 max-w-2xl text-xl leading-8 text-muted-foreground">{product.outcome}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <CreatorIdentity creator={product.creator} />
                <Rating rating={product.rating} count={product.reviewCount} />
                <span className="text-xs text-muted-foreground">
                  {product.usageCount.toLocaleString(numbers)} {l.uses}
                </span>
              </div>
              {/* The same three claims, in the same order and style, as the
                  hero card's corner chips. */}
              <div className="mt-8 flex flex-wrap gap-3" aria-label={l.manifest}>
                <TrustChip
                  icon={<ShieldCheck size={12} className={product.verified ? "text-verified" : "text-warning"} />}
                  label={product.verified ? l.verified : l.notReviewed}
                  sub={product.verified ? l.safety : l.pending}
                />
                <TrustChip className="max-w-xs" icon={<Lock size={12} className="text-accent" />} label={product.permissions ?? l.notDeclared} sub={l.scope} />
                <TrustChip icon={<FileText size={12} className="text-primary" />} label={product.license ?? l.notStated} sub={l.licence} />
              </div>
            </header>

            <Section title={l.whatItDoes}>
              <p>{product.description}</p>
              {product.benefits.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {product.benefits.map((benefit) => (
                    <p key={benefit} className="flex gap-3 rounded-md bg-surface p-4 text-sm text-foreground">
                      <Check className="mt-1 shrink-0 text-success" size={16} />
                      {benefit}
                    </p>
                  ))}
                </div>
              )}
            </Section>

            <Section title={l.manifest} id="manifest">
              <ManifestTable rows={manifestRows(product, l, locale)} />
            </Section>

            {(product.useCases ?? []).length > 0 && (
              <Section title={l.useCases}>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(product.useCases ?? []).map((useCase) => (
                    <div key={useCase.title} className="border-s-2 border-primary/40 ps-4">
                      <h3 className="font-semibold text-foreground">{useCase.title}</h3>
                      <p className="mt-1 text-sm">{useCase.description}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {(product.includedFiles ?? []).length > 0 && (
              <Section title={l.included}>
                <div className="overflow-hidden rounded-lg border bg-surface">
                  {(product.includedFiles ?? []).map((file) => (
                    <div className="grid gap-1 border-b p-4 last:border-0 sm:grid-cols-[12rem_1fr]" key={file.name}>
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
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6">{product.exampleInput}</pre>
                  </div>
                  <div>
                    <p className="eyebrow">{l.output}</p>
                    <div className="mt-2 rounded-lg bg-foreground p-5 text-background">
                      <p className="editorial text-2xl">{product.exampleOutputTitle}</p>
                      <p className="mt-2 text-sm text-background/70">{product.exampleOutputBody}</p>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            <Section title={`${l.reviews} · ${product.rating}`} id="reviews">
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
              <div className="rounded-lg border bg-surface p-6">
                <CreatorIdentity creator={product.creator} />
                <p className="mt-4 max-w-2xl">{product.creator.bio}</p>
                <p className="mt-4 text-xs font-semibold text-foreground">
                  {product.creator.products} {l.resources} · {product.creator.followers.toLocaleString(numbers)} {l.followers}
                </p>
              </div>
            </Section>
          </div>

          {/* --- right rail -------------------------------------------------- */}
          <aside>
            <div className="space-y-5 rounded-xl border border-border-strong bg-surface-raised p-5 shadow-soft lg:sticky lg:top-24">
              <div>
                <p className="text-xs text-muted-foreground">{l.sharing}</p>
                <p className="mt-1 text-2xl font-semibold">{l.free}</p>
              </div>
              {/* Install instructions are pinned to the release a reader
                  acquires, so acquiring is the install path. */}
              <ProductActions product={product} />
              <p className="text-xs leading-5 text-muted-foreground">{l.installNote}</p>
              {product.versions.length > 0 && (
                <div className="border-t pt-5">
                  <VersionPicker versions={product.versions} />
                </div>
              )}
            </div>
          </aside>
        </div>

        {product.related.length > 0 && (
          <section className="mt-12 border-t pt-12">
            <p className="eyebrow">{l.keepBuilding}</p>
            <h2 className="editorial mt-2 text-4xl">{l.related}</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
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
