import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
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
      {creator.verified && (
        <CheckCircle2
          size={14}
          className="text-accent"
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
