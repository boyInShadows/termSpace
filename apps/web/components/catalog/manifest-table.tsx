import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ManifestRow = {
  key: string;
  label: string;
  value: ReactNode;
  tone?: "verified" | "attention";
};

/**
 * What a listing touches, needs and permits, as a definition table with
 * mono labels, never prose. Trust is product information, and this is where
 * the product states it.
 */
export function ManifestTable({ rows, className }: { rows: ManifestRow[]; className?: string }) {
  return (
    <dl className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4"
        >
          <dt className="font-mono text-xs text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              "min-w-0 break-words text-sm text-foreground",
              row.tone === "verified" && "text-verified",
              row.tone === "attention" && "text-warning",
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
