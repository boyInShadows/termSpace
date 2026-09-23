"use client";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

/**
 * The one card frame every dashboard panel uses, so loading, empty, error and
 * ready states all share the same outer box and the layout cannot jump when a
 * panel changes state.
 */
export function DashboardCard({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("rounded-[var(--radius-card)] border border-border bg-surface", className)}
      aria-label={title}
    >
      {title && (
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <h2 className="text-base font-medium">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Inline failure for one card — never a page-wide banner. */
export function CardError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const { t } = useLocale();
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 pb-5", className)}>
      <p className="text-sm text-destructive" role="alert">
        {t.dashboardHome.loadError}
      </p>
      <Button size="sm" variant="ghost" onClick={onRetry}>
        <RotateCcw aria-hidden className="size-4" />
        {t.dashboardHome.retry}
      </Button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded bg-muted motion-reduce:animate-none", className)} />;
}
