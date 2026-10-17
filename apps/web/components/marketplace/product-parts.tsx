import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCheck, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import type { Compatibility, Creator, ProductType } from "@/lib/types";
/** `label` is the localized name; server callers without a locale fall back to the type key. */
export function ProductTypeBadge({ type, label }: { type: ProductType; label?: string }) {
  return <Badge variant="info">{label ?? type}</Badge>;
}
export function CreatorIdentity({
  creator,
  compact = false,
}: {
  creator: Creator;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        initials={creator.initials}
        className={compact ? "size-7 text-xs" : ""}
      />
      <span className="text-sm font-medium">{creator.name}</span>
      {/* Identity, not safety: a scalloped badge in the brand colour, so it
          cannot be read as the green shield that means a reviewed listing. */}
      {creator.verified && (
        <BadgeCheck
          size={15}
          className="text-primary"
          aria-label="Verified creator"
        />
      )}
    </div>
  );
}
export function Rating({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <Star size={14} className="fill-warning text-warning" />
      <span>{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
export function CompatibilityBadges({
  compatibility,
  limit = 2,
}: {
  compatibility: Compatibility;
  limit?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {compatibility.platforms.slice(0, limit).map((x) => (
        <Badge key={x} variant="outline">
          {x}
        </Badge>
      ))}
      {compatibility.platforms.length > limit && (
        <Badge variant="outline">
          +{compatibility.platforms.length - limit}
        </Badge>
      )}
    </div>
  );
}
export function TrustStatus({
  status = "Passed",
}: {
  status?: "Passed" | "Review";
}) {
  return (
    <Badge variant={status === "Passed" ? "success" : "warning"}>
      <ShieldCheck size={12} />
      Security scan {status.toLowerCase()}
    </Badge>
  );
}

export type TrustStripLabels = {
  safetyReviewed: string;
  notReviewed: string;
  permissionsLabel: string;
  permissionsNone: string;
  licenceLabel: string;
  licenceNone: string;
};

/**
 * What a listing declares about itself, scannable from the card: whether its
 * safety was reviewed, its licence, and what it touches. The permissions line
 * wraps to two lines before it clips, because its tail ("no network access")
 * is the part that matters. A listing that declares nothing says so instead of
 * leaving a gap that reads like "nothing to declare".
 */
export function TrustStrip({
  verified,
  permissions,
  license,
  labels,
  compact = false,
}: {
  verified: boolean;
  permissions?: string | null;
  license?: string | null;
  labels: TrustStripLabels;
  compact?: boolean;
}) {
  return (
    <div className="mt-3 space-y-0.5 text-xs leading-5">
      <p className="flex min-w-0 items-center gap-1.5">
        {verified ? (
          <ShieldCheck size={14} aria-hidden className="shrink-0 text-verified" />
        ) : (
          <ShieldAlert size={14} aria-hidden className="shrink-0 text-warning" />
        )}
        <span className={verified ? "font-semibold text-foreground" : "font-semibold text-muted-foreground"}>
          {verified ? labels.safetyReviewed : labels.notReviewed}
        </span>
        <span aria-hidden className="text-border-strong">·</span>
        <span className="sr-only">{labels.licenceLabel}: </span>
        {license ? (
          <bdi dir="ltr" className="truncate font-mono text-muted-foreground">{license}</bdi>
        ) : (
          <span className="truncate text-muted-foreground">{labels.licenceNone}</span>
        )}
      </p>
      {!compact && (
        <p className="ts-bidi line-clamp-2 text-muted-foreground" title={permissions ?? undefined}>
          <span className="sr-only">{labels.permissionsLabel}: </span>
          {permissions ?? labels.permissionsNone}
        </p>
      )}
    </div>
  );
}
