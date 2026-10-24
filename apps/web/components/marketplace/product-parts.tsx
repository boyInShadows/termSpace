import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCheck, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { Compatibility, Creator, ProductType } from "@/lib/types";
/** `label` is the localized name; server callers without a locale fall back to the type key. */
export function ProductTypeBadge({ type, label }: { type: ProductType; label?: string }) {
  return <Badge variant="outline">{label ?? type}</Badge>;
}
export function CreatorIdentity({
  creator,
  compact = false,
  href,
  verifiedLabel = "Verified creator",
}: {
  creator: Creator;
  compact?: boolean;
  href?: string;
  verifiedLabel?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        initials={creator.initials}
        className={compact ? "size-7 text-xs" : ""}
      />
      {href ? <Link href={href} className="relative z-10 inline-flex min-h-7 min-w-0 items-center text-sm font-medium underline-offset-4 hover:underline"><bdi className="min-w-0 break-words">{creator.name}</bdi></Link> : <span className="min-w-0 break-words text-sm font-medium"><bdi>{creator.name}</bdi></span>}
      {/* Identity, not safety: a scalloped badge in the brand colour, so it
          cannot be read as the green shield that means a reviewed listing. */}
      {creator.verified && (
        <BadgeCheck
          size={15}
          className="shrink-0 text-primary"
          role="img"
          aria-label={verifiedLabel}
        />
      )}
    </div>
  );
}
/** With a `locale`, the digits follow it; server callers without one keep Latin digits. */
export function Rating({ rating, count, locale = "en" }: { rating: number; count?: number; locale?: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <Star size={14} aria-hidden className="fill-warning text-warning" />
      <span>{formatNumber(rating, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({formatNumber(count, locale)})</span>
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
          {/* A Latin island like the platform names beside it, so the plus
              stays in front of the number in a right-to-left row. */}
          <bdi dir="ltr">+{compatibility.platforms.length - limit}</bdi>
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
  reviewLabel: string;
  safetyReviewed: string;
  notReviewed: string;
  permissionsLabel: string;
  licenceLabel: string;
  licenceNone: string;
  notDeclared: string;
  notStated: string;
};

function ReviewState({ verified, labels }: { verified: boolean; labels: TrustStripLabels }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold">
      {verified ? (
        <ShieldCheck size={14} aria-hidden className="shrink-0 text-verified" />
      ) : (
        <ShieldAlert size={14} aria-hidden className="shrink-0 text-warning" />
      )}
      <span className={verified ? "text-foreground" : "text-muted-foreground"}>
        {verified ? labels.safetyReviewed : labels.notReviewed}
      </span>
    </span>
  );
}

/**
 * What a listing declares about itself, where the decision to trust it is
 * made: its review state, what it touches and its licence, each a labelled
 * row read at full weight. Values wrap rather than clip, because a trust
 * value you cannot read in full is worse than none. Undeclared access is the
 * one red mark on the card (red means absent, never error), so a reviewed
 * listing that declares nothing cannot pass for a safe one.
 *
 * `compact` is the single line the landing shelf has room for: review state
 * and licence only.
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
  if (compact) {
    return (
      <p className="mt-3 flex min-w-0 items-center gap-1.5 text-xs leading-5">
        <ReviewState verified={verified} labels={labels} />
        <span aria-hidden className="text-border-strong">·</span>
        <span className="sr-only">{labels.licenceLabel}: </span>
        {license ? (
          <bdi dir="ltr" className="truncate font-mono text-muted-foreground">{license}</bdi>
        ) : (
          <span className="truncate text-muted-foreground">{labels.licenceNone}</span>
        )}
      </p>
    );
  }

  return (
    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs leading-5">
      <dt className="text-muted-foreground">{labels.reviewLabel}</dt>
      <dd>
        <ReviewState verified={verified} labels={labels} />
      </dd>

      <dt className="text-muted-foreground">{labels.permissionsLabel}</dt>
      <dd className="ts-bidi text-foreground">
        {permissions ?? (
          <span className="inline-block rounded-sm border border-destructive/60 px-1.5 font-semibold text-destructive">
            {labels.notDeclared}
          </span>
        )}
      </dd>

      <dt className="text-muted-foreground">{labels.licenceLabel}</dt>
      <dd className="ts-bidi">
        {license ? (
          <bdi dir="ltr" className="font-mono text-foreground">{license}</bdi>
        ) : (
          <span className="text-muted-foreground">{labels.notStated}</span>
        )}
      </dd>
    </dl>
  );
}
