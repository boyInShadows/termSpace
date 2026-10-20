"use client";
import { useId } from "react";
import Link from "next/link";
import { ListingLink } from "@/components/catalog/listing-link";
import { listingTransitionName } from "@/lib/listing-transition";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatNumber, intlLocale } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale-context";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
  TrustStrip,
} from "./product-parts";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { localePath } from "@/lib/i18n";

/**
 * A listing card.
 *
 * `outcome` is the only prose on the card — it is the one-line promise of what
 * the listing does. `description` is the longer body copy and belongs on the
 * detail page, not here; rendering both made every card carry two competing
 * paragraphs of different lengths, which is what threw the grid out of
 * alignment.
 *
 * The title is the card's one link to the listing, stretched over the whole
 * card, so a keyboard reaches each listing once and the whole card answers a
 * click. The favourite and community links sit above that layer.
 */
export function ProductCard({
  product,
  variant = "card",
}: {
  product: Product;
  variant?: "card" | "list";
}) {
  const { t, fa, locale } = useLocale();
  const { isFavorite, toggleFavorite } = useMarketplaceSession();
  const titleId = useId();
  const saved = isFavorite(product.slug);
  const card = t.productCard;
  const href = localePath(`/products/${product.slug}`, locale);
  const isList = variant === "list";

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
          "group relative flex h-full min-w-0 flex-col border border-border-strong bg-background p-5 transition-colors duration-200",
          "hover:border-foreground/60 focus-within:border-primary",
        isList && "sm:flex-row sm:items-stretch sm:gap-6",
      )}
    >
      {/* --- body ------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ProductTypeBadge type={product.type} label={card.types[product.type]} />
            {product.featured && <Badge variant="primary">{card.editorsPick}</Badge>}
            {/* Neutral, not amber: amber is the "not yet reviewed" caution. */}
            {product.trending && <Badge>{card.trending}</Badge>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 -me-2 -mt-2 shrink-0"
            aria-label={`${saved ? card.removeFavorite : card.addFavorite}: ${product.name}`}
            aria-pressed={saved}
            onClick={() => void toggleFavorite(product.slug)}
          >
            <Heart
              size={18}
              className={
                saved ? "fill-primary text-primary" : "text-muted-foreground"
              }
            />
          </Button>
        </div>

        {/* Named like the detail page header: on navigation the title
            travels from here into it (listing-link.tsx, docs/motion.md). */}
        <h3
          id={titleId}
          className="ts-listing-title ts-bidi editorial mt-4 text-xl font-semibold leading-snug"
          style={{ viewTransitionName: listingTransitionName(product.id) }}
        >
          <ListingLink
            href={href}
            listingId={product.id}
            className="inline-block rounded-sm transition-colors group-hover:text-primary after:absolute after:inset-0 after:rounded-lg after:content-['']"
          >
            {product.name}
          </ListingLink>
        </h3>

        {/* The single description. Clamped and floor-height so that every card
            in a row reaches its trust block at the same y-position. */}
        <p className="ts-bidi mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {product.outcome}
        </p>

        <TrustStrip
          verified={product.verified}
          permissions={product.permissions}
          license={product.license}
          labels={card}
        />

        <div className="mt-4">
          <CreatorIdentity creator={product.creator} compact verifiedLabel={card.verifiedCreator} />
        </div>
        {product.communities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={card.communities}>
            {product.communities.slice(0, 3).map((community) => (
              <Link
                key={community.slug}
                href={localePath(`/communities/${community.slug}`, locale)}
                className="relative z-10 inline-flex min-h-6 items-center rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant="outline">{fa ? community.nameFa ?? community.nameEn : community.nameEn}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* --- footer, pinned to the bottom so rows stay aligned ----------- */}
      <div
        className={cn(
          "mt-5 border-t border-border pt-4",
          isList &&
            "sm:mt-0 sm:w-64 sm:shrink-0 sm:border-s sm:border-t-0 sm:ps-6 sm:pt-0",
        )}
      >
        <CompatibilityBadges compatibility={product.compatibility} />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Rating rating={product.rating} count={product.reviewCount} locale={locale} />
          <span>
            {formatNumber(product.usageCount, locale, { compact: true })} {card.uses}
          </span>
          <span>
            {card.updated} <bdi>{new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric" }).format(new Date(product.updatedAt))}</bdi>
          </span>
        </div>
      </div>
    </article>
  );
}
