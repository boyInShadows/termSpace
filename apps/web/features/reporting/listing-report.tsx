"use client";

import { lazy, Suspense, useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";

const ReportForm = lazy(() => import("./listing-report-form").then((module) => ({ default: module.ListingReportForm })));

export function ListingReport({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const { email } = useMarketplaceSession();
  const [activated, setActivated] = useState(false);
  return <details id="report-listing" className="group min-w-0 border-t border-border pt-2" onToggle={(event) => { if (event.currentTarget.open) setActivated(true); }}>
    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <Flag className="size-4 shrink-0" aria-hidden="true" />{locale === "fa" ? "گزارش آگهی" : "Report listing"}<ChevronDown className="ms-auto size-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
    </summary>
    {activated && <Suspense fallback={<p role="status" className="py-3 text-sm text-muted-foreground">{locale === "fa" ? "در حال بارگذاری…" : "Loading…"}</p>}><ReportForm key={`${slug}:${email ?? "anonymous"}`} slug={slug} /></Suspense>}
  </details>;
}
