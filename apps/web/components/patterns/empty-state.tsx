"use client";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
export function EmptyState({ onReset, query, filtered = false }: { onReset?: () => void; query?: string; filtered?: boolean }) {
  const { t } = useLocale();
  const copy = t.discovery;
  const description = query
    ? copy.emptySearch.replace("{query}", query)
    : filtered ? copy.emptyFiltered : copy.emptyDefault;
  return (
    <div className="col-span-full border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <SearchX className="mx-auto text-muted-foreground" />
      <h3 className="editorial mt-4 text-2xl font-semibold">
        {copy.emptyTitle}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {onReset && (
        <Button variant="secondary" className="mt-5" onClick={onReset}>
          {copy.clearAll}
        </Button>
      )}
    </div>
  );
}
