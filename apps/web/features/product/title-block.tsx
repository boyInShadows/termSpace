import { CreatorIdentity, Rating } from "@/components/marketplace/product-parts";
import { formatNumber } from "@/lib/format";
import { copy, localePath, type Locale } from "@/lib/i18n";
import { listingTransitionName } from "@/lib/listing-transition";
import type { ProductDetail } from "@/lib/types";
import { Absent, Fact, ReleaseFacts } from "./release-facts";
import { SelectedRelease } from "./release-selection";

const text = {
  en: {
    uses: "uses", platforms: "Platforms", models: "Models", review: "Review", reviewed: "Reviewed",
    notReviewed: "Not yet reviewed", notStated: "Not stated", noRelease: "No approved release", release: "Release", keyFacts: "Key facts",
  },
  fa: {
    uses: "استفاده", platforms: "پلتفرم‌ها", models: "مدل‌ها", review: "بررسی", reviewed: "بررسی‌شده",
    notReviewed: "هنوز بررسی نشده", notStated: "ذکر نشده", noRelease: "نسخهٔ تأییدشده‌ای نیست", release: "نسخه", keyFacts: "اطلاعات کلیدی",
  },
};

/** Name, outcome and who made it. The facts a reader decides on follow in `ProductFacts`. */
export function ProductHeader({ product, typeLabel, locale }: { product: ProductDetail; typeLabel: string; locale: Locale }) {
  const t = text[locale];
  return (
    <header className="min-w-0">
      {/* Shares its name with the card title, so the title travels from the card into this header on navigation. */}
      <h1
        className="ts-listing-title ts-bidi max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl"
        style={{ viewTransitionName: listingTransitionName(product.id) }}
        data-listing-header={product.id}
      >
        {product.name}
      </h1>
      <p className="ts-bidi mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{product.outcome}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm tabular-nums text-muted-foreground">
        <span>{typeLabel}</span>
        <CreatorIdentity creator={product.creator} href={localePath(`/creators/${product.creator.handle}`, locale)} verifiedLabel={copy[locale].productCard.verifiedCreator} />
        <Rating rating={product.rating} count={product.reviewCount} />
        <span>{formatNumber(product.usageCount, locale)} {t.uses}</span>
      </div>
    </header>
  );
}

/**
 * What the reader needs before adding: platform, review state, permissions,
 * licence and the pinned release. The release rows follow the version picked
 * in the rail, so they always describe what "Add" will pin.
 */
export function ProductFacts({ product, locale }: { product: ProductDetail; locale: Locale }) {
  const t = text[locale];
  return (
    <section aria-label={t.keyFacts}>
      <dl className="border-b border-border">
        <Fact label={t.platforms}>{product.compatibility.platforms.join(" · ") || t.notStated}</Fact>
        {product.compatibility.models.length > 0 && <Fact label={t.models}>{product.compatibility.models.join(" · ")}</Fact>}
        <Fact label={t.review}>
          {product.verified
            ? <span className="font-semibold text-verified">{t.reviewed}</span>
            : <Absent>{t.notReviewed}</Absent>}
        </Fact>
        <SelectedRelease view="facts" slug={product.slug} locale={locale}>
          {product.release
            ? <ReleaseFacts release={product.release} locale={locale} summary={{ permissions: product.permissions, license: product.license }} />
            : <Fact label={t.release}><Absent>{t.noRelease}</Absent></Fact>}
        </SelectedRelease>
      </dl>
    </section>
  );
}
