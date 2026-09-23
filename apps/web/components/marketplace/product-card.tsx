"use client";
import Link from "next/link";
import { ArrowUpRight, Clock3, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale-context";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
} from "./product-parts";
import { useMarketplaceSession } from "@/features/account/marketplace-session";

/**
 * A listing card.
 *
 * `outcome` is the only prose on the card — it is the one-line promise of what
 * the listing does. `description` is the longer body copy and belongs on the
 * detail page, not here; rendering both made every card carry two competing
 * paragraphs of different lengths, which is what threw the grid out of
 * alignment.
 */
export function ProductCard({
  product,
  variant = "card",
}: {
  product: Product;
  variant?: "card" | "list";
}) {
  const { t, fa } = useLocale();
  const { isFavorite, toggleFavorite } = useMarketplaceSession();
  const saved = isFavorite(product.slug);
  const href = `/products/${product.slug}`;
  const isList = variant === "list";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition duration-200",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift focus-within:border-primary",
        isList && "sm:flex-row sm:items-stretch sm:gap-6",
      )}
    >
      {/* --- body ------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ProductTypeBadge type={product.type} />
            {product.featured && <Badge variant="primary">Editor’s pick</Badge>}
            {product.trending && <Badge variant="warning">Trending</Badge>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 shrink-0"
            aria-label={`${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} favorites`}
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

        <h3 className="editorial mt-4 text-xl font-semibold leading-snug">
          <Link
            href={href}
            className="rounded-sm group-hover:text-primary focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        {/* The single description. Clamped and floor-height so that every card
            in a row reaches its divider at the same y-position. */}
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {product.outcome}
        </p>

        <div className="mt-4">
          <CreatorIdentity creator={product.creator} compact />
        </div>
        {product.communities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Communities">
            {product.communities.slice(0, 3).map((community) => (
              <Link key={community.slug} href={`/communities/${community.slug}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Badge variant="outline">{community.nameEn}</Badge>
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
            "sm:mt-0 sm:w-64 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0",
        )}
      >
        <CompatibilityBadges compatibility={product.compatibility} />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Rating rating={product.rating} count={product.reviewCount} />
          <span className="inline-flex items-center gap-1">
            <Clock3 size={12} />
            {formatCount(product.usageCount)} uses
          </span>
          <span dir="ltr">
            {new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { month: "short", day: "numeric" }).format(new Date(product.updatedAt))}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            href={href}
            aria-label={`${t.viewDetails}: ${product.name}`}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "gap-1.5 group-hover:border-primary group-hover:text-primary",
            )}
          >
            {t.viewDetails}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
