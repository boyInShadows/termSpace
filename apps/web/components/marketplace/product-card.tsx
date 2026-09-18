"use client";
import Link from "next/link";
import { Heart, ArrowUpRight, Clock3 } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
} from "./product-parts";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
export function ProductCard({
  product,
  variant = "compact",
}: {
  product: Product;
  variant?: "compact" | "expanded" | "list";
}) {
  const { isFavorite, toggleFavorite } = useMarketplaceSession();
  const saved = isFavorite(product.slug);
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift focus-within:border-primary",
        variant === "list"
          ? "rounded-lg p-5 sm:flex-row sm:items-center sm:gap-6"
          : "rounded-lg p-5",
      )}
    >
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
        <Link
          href={`/products/${product.slug}`}
          className="mt-4 rounded-sm focus-visible:outline-none"
        >
          <h3 className="editorial text-xl font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {product.outcome}
          </p>
        </Link>
        <div className="mt-4">
          <CreatorIdentity creator={product.creator} compact />
        </div>
        {variant === "expanded" && (
          <p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
      </div>
      <div
        className={cn(
          "mt-5 border-t pt-4",
          variant === "list" &&
            "sm:mt-0 sm:w-60 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0",
        )}
      >
        <CompatibilityBadges compatibility={product.compatibility} />
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <Rating rating={product.rating} count={product.reviewCount} />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 size={12} />
              {formatCount(product.usageCount)} uses ·{" "}
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(product.updatedAt))}
            </p>
          </div>
          <ArrowUpRight size={15} className="text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
