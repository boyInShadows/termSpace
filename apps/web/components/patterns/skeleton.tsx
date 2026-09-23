import { cn } from "@/lib/utils";

/**
 * Loading placeholders for the homepage's data-driven sections.
 *
 * Every skeleton mirrors the real component's box model — same padding, same
 * border, same minimum heights — so when the data arrives nothing on the page
 * moves. A skeleton that is merely "about the right size" trades a blank
 * section for a layout shift, which is the worse of the two.
 *
 * The whole group is `aria-hidden` and announced once by the live region that
 * wraps it, so a screen reader hears "loading" rather than a dozen empty boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block animate-pulse rounded bg-muted", className)}
    />
  );
}

function SkeletonGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Matches `ProductCard`: badge row, title, two-line outcome, creator, footer. */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="size-6 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <div className="mt-2 min-h-12 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <div className="mt-5 flex-1 border-t border-border pt-4">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="mt-3 h-3 w-48" />
        <div className="mt-4 flex justify-end">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ label, count = 3 }: { label: string; count?: number }) {
  return (
    <SkeletonGroup label={label} className="grid gap-5 md:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Matches the creator tile: identity row, bio, meta line. */
export function CreatorGridSkeleton({ label, count = 3 }: { label: string; count?: number }) {
  return (
    <SkeletonGroup label={label} className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className="rounded-xl border border-border bg-background/70 p-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          <Skeleton className="mt-5 h-3 w-36" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** Matches the hairline-gap category grid, including its 8rem cell floor. */
export function CategoryGridSkeleton({ label, count = 9 }: { label: string; count?: number }) {
  return (
    <SkeletonGroup label={label}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} aria-hidden className="min-h-32 bg-background p-5">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="mt-9 h-4 w-24" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
