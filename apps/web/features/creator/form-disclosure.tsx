"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { draftValidationCopy } from "./draft-validation";

// Optional fields stay mounted inside a closed <details>, so their values still
// submit and survive step changes. The editor opens it when one of them is invalid.
export function FormDisclosure({ summary, defaultOpen = false, children }: { summary: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [initiallyOpen] = useState(defaultOpen);
  const { locale } = useLocale(); const copy = draftValidationCopy[locale];
  return <details open={initiallyOpen} className="group rounded-control border-[length:0.0625rem] border-border-strong bg-surface">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control px-4 py-3 text-sm hover:bg-muted [&::-webkit-details-marker]:hidden">
      <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">{copy.additional}<span className="text-xs font-normal text-muted-foreground">{copy.optional}</span></span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{summary}</span></span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-hover) group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
    </summary>
    <div className="space-y-5 border-t p-4">{children}</div>
  </details>;
}
