"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";

/**
 * A degraded-data notice that lives inside the section it describes.
 *
 * A full-width red strip above the fold tells the reader the whole page is
 * broken, which is both alarming and untrue — the catalogue is unreachable,
 * the page is not. Keeping the notice inside the affected section scopes the
 * claim correctly and leaves the primary action reachable.
 *
 * Retry calls `router.refresh()`, which re-runs the server render (and so the
 * fetch) without discarding client state or scroll position.
 */
export function SectionNotice({ className }: { className?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm",
        className,
      )}
    >
      <AlertTriangle size={16} className="shrink-0 text-warning" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{t.homePage.degradedTitle}</span>{" "}
        <span className="text-muted-foreground">{t.homePage.degradedBody}</span>
      </span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 font-semibold transition hover:bg-muted disabled:opacity-60"
      >
        <RefreshCw
          size={13}
          className={cn(isPending && "motion-safe:animate-spin")}
          aria-hidden
        />
        {isPending ? t.homePage.retrying : t.homePage.retry}
      </button>
    </div>
  );
}
