"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Optional fields stay mounted inside a closed <details>, so their values still
// submit and survive step changes. The editor opens it when one of them is invalid.
export function FormDisclosure({ summary, defaultOpen = false, children }: { summary: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [initiallyOpen] = useState(defaultOpen);
  return <details open={initiallyOpen} className="group rounded-control border bg-surface">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
      {summary}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="space-y-5 border-t p-4">{children}</div>
  </details>;
}
