"use client";
import { SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";

type EmptyStateFilter = { key: string; label: string; clear: () => void };

/**
 * No results. A search names what was searched, in its own direction, and a
 * long or odd query wraps instead of overflowing; each active filter can be
 * dropped on its own; "Clear all" appears only when there is something to clear.
 */
export function EmptyState({ onReset, query, filtered = false, filters = [] }: { onReset?: () => void; query?: string; filtered?: boolean; filters?: EmptyStateFilter[] }) {
  const { t } = useLocale();
  const copy = t.discovery;
  const [before, after] = copy.emptySearch.split("{query}");
  return (
    <div className="col-span-full border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <SearchX className="mx-auto text-muted-foreground" />
      <h3 className="editorial mt-4 text-2xl font-semibold">
        {copy.emptyTitle}
      </h3>
      <p className="mx-auto mt-2 max-w-md break-words text-sm text-muted-foreground">
        {query ? <>{before}<bdi>{query}</bdi>{after}</> : filtered ? copy.emptyFiltered : copy.emptyDefault}
      </p>
      {filters.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <Button key={filter.key} variant="secondary" size="sm" className="min-h-11 sm:min-h-9" onClick={filter.clear} aria-label={`${copy.removeFilter}: ${filter.label}`}>
              {filter.label}
              <X size={14} aria-hidden />
            </Button>
          ))}
        </div>
      )}
      {onReset && (
        <Button variant="secondary" className="mt-5" onClick={onReset}>
          {copy.clearAll}
        </Button>
      )}
    </div>
  );
}
