"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-8 text-xs", px: 32 },
  md: { box: "size-10 text-sm", px: 40 },
  lg: { box: "size-14 text-lg", px: 56 },
} as const;

/** Up to two initials from a listing name (names are English-only, so this is plain ASCII). */
export function listingInitials(name: string) {
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "·";
}

/**
 * A listing's icon: a rounded square, deliberately unlike the circular creator `Avatar`, so a listing's
 * picture is never mistaken for a person or a trust mark. The server only accepts GitHub image hosts
 * (marketplaceManifest.ts); the image is loaded by the browser with no referrer. It carries no meaning of
 * its own — the name sits beside it — so it is decorative, and a missing or broken image falls back to
 * initials in a tile of the same size, so nothing shifts either way.
 */
export function ProductIcon({
  name,
  iconUrl,
  size = "md",
  className,
}: {
  name: string;
  iconUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = iconUrl && iconUrl !== failedUrl ? iconUrl : null;
  const { box, px } = sizes[size];
  return (
    <span
      aria-hidden
      dir="ltr"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-control border border-border font-semibold",
        // A white plate keeps transparent, dark-on-light logos legible in the dark theme too.
        src ? "bg-white" : "bg-muted text-muted-foreground",
        box,
        className,
      )}
    >
      {src ? (
        // Plain <img> on purpose: next/image would have our server fetch and resize a creator-influenced URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        listingInitials(name)
      )}
    </span>
  );
}
