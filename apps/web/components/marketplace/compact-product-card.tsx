"use client";
import Link from "next/link";
import { ArrowUpRight, Heart, Star } from "lucide-react";
import { ListingLink } from "@/components/catalog/listing-link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { formatNumber } from "@/lib/format";
import { localePath } from "@/lib/i18n";
import { listingTransitionName } from "@/lib/listing-transition";
import { useLocale } from "@/lib/locale-context";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreatorIdentity, ProductTypeBadge, TrustStrip } from "./product-parts";

/**
 * The listing card at hero scale: promise, trust line, creator, rating.
 *
 * Its own file so the product page, which also renders `ProductCard`, does not
 * pay for it in first-load JS. What it leaves out — permissions, compatibility,
 * communities, usage — is all on the detail page one click away.
 */
export function CompactProductCard({ product }: { product: Product }) {
  const { t, locale } = useLocale();
  const { isFavorite, toggleFavorite } = useMarketplaceSession();
  const saved = isFavorite(product.slug);
  const card = t.productCard;
  const href = localePath(`/products/${product.slug}`, locale);

  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-border bg-surface p-4 fit-short:p-3 transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift focus-within:border-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ProductTypeBadge type={product.type} label={card.types[product.type]} />
          {product.featured && <Badge variant="primary">{card.editorsPick}</Badge>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-me-2 -mt-2 shrink-0"
          aria-label={`${saved ? card.removeFavorite : card.addFavorite}: ${product.name}`}
          aria-pressed={saved}
          onClick={() => void toggleFavorite(product.slug)}
        >
          <Heart
            size={18}
            className={saved ? "fill-primary text-primary" : "text-muted-foreground"}
          />
        </Button>
      </div>

      <h3
        className="ts-listing-title ts-bidi editorial -mt-1 text-lg font-semibold leading-snug"
        style={{ viewTransitionName: listingTransitionName(product.id) }}
      >
        <ListingLink
          href={href}
          listingId={product.id}
          className="-my-1 inline-block rounded-sm py-1 group-hover:text-primary focus-visible:outline-none focus-visible:underline"
        >
          {product.name}
        </ListingLink>
      </h3>

      <p className="ts-bidi mt-1 line-clamp-2 fit-short:line-clamp-1 text-sm leading-5 text-muted-foreground">
        {product.outcome}
      </p>

      <TrustStrip
        verified={product.verified}
        permissions={product.permissions}
        license={product.license}
        labels={card}
        compact
      />

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <CreatorIdentity creator={product.creator} compact verifiedLabel={card.verifiedCreator} />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <Star size={14} className="fill-warning text-warning" />
            {formatNumber(product.rating, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-muted-foreground">({formatNumber(product.reviewCount, locale)})</span>
          </span>
          <Link
            href={href}
            aria-label={`${t.viewDetails}: ${product.name}`}
            className={cn(
              buttonVariants({ variant: "secondary", size: "icon" }),
              "size-8 group-hover:border-primary group-hover:text-primary",
            )}
          >
            <ArrowUpRight size={14} className="rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </article>
  );
}
