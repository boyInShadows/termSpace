"use client";
import Link from "next/link";
import { Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { listingStateLabel } from "@/features/creator/creator-dashboard";
import { formatRelative, listingTone, OVERVIEW_LISTING_LIMIT, type ListingTone } from "@/lib/dashboard";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { CreatorDashboardListing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CardError, DashboardCard, Skeleton } from "./dashboard-card";
import type { OverviewState } from "./overview-state";

const TONE_CLASS: Record<ListingTone, string> = {
  live: "bg-success/15 text-success",
  review: "bg-warning/15 text-warning",
  attention: "bg-destructive/15 text-destructive",
  draft: "bg-muted text-muted-foreground",
};

const HEAD_CELL = "py-2 font-normal";
const ROW_COUNT_WHILE_LOADING = 5;

export function ListingsTable({ state, now, onRetry }: { state: OverviewState; now: number; onRetry: () => void }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const viewAll = (
    <Link href={localePath("/creator", locale)} className="text-sm text-primary transition-colors hover:text-primary-hover">
      {copy.viewAll} <span aria-hidden>{locale === "fa" ? "←" : "→"}</span>
    </Link>
  );

  return (
    <DashboardCard title={copy.listingsTitle} action={viewAll}>
      {state.status === "loading" && <ListingsSkeleton />}
      {state.status === "error" && <CardError onRetry={onRetry} />}
      {state.status === "ready" && state.home.kind === "no-profile" && (
        <EmptyListings title={copy.noProfile} cta={copy.noProfileCta} href={localePath("/creator", locale)} />
      )}
      {state.status === "ready" && state.home.kind === "creator" && (
        state.home.dashboard.listings.length === 0 ? (
          <EmptyListings
            title={copy.emptyListings}
            cta={copy.emptyListingsCta}
            href={localePath("/creator/listings/new", locale)}
          />
        ) : (
          <ListingRows rows={state.home.dashboard.listings.slice(0, OVERVIEW_LISTING_LIMIT)} now={now} />
        )
      )}
    </DashboardCard>
  );
}

function ListingRows({ rows, now }: { rows: CreatorDashboardListing[]; now: number }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const localeTag = locale === "fa" ? "fa-IR" : "en-US";
  const number = new Intl.NumberFormat(localeTag);
  const fullDate = new Intl.DateTimeFormat(localeTag, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground rtl:font-sans rtl:text-xs rtl:tracking-normal">
          <tr className="border-y border-border/60">
            <th scope="col" className={cn(HEAD_CELL, "ps-5 text-start")}>{copy.colName}</th>
            <th scope="col" className={cn(HEAD_CELL, "hidden text-start sm:table-cell")}>{copy.colVersion}</th>
            <th scope="col" className={cn(HEAD_CELL, "px-3 text-start")}>{copy.colStatus}</th>
            <th scope="col" className={cn(HEAD_CELL, "pe-5 text-end sm:pe-3")}>{copy.colAcquisitions}</th>
            <th scope="col" className={cn(HEAD_CELL, "hidden pe-5 text-end md:table-cell")}>{copy.colUpdated}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="h-12 border-b border-border/60 transition-colors last:border-0 hover:bg-surface-raised/60">
              <td className="max-w-0 ps-5 sm:max-w-none">
                <Link
                  href={localePath(`/creator/listings/${row.id}/releases`, locale)}
                  className="flex min-w-0 items-center gap-2"
                >
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="shrink-0 rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-foreground/80">
                    {row.type}
                  </span>
                </Link>
              </td>
              <td className="hidden font-mono text-muted-foreground sm:table-cell">
                <bdi dir="ltr">v{row.currentVersion}</bdi>
              </td>
              <td className="px-3">
                <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs", TONE_CLASS[listingTone(row.state)])}>
                  {listingStateLabel(row.state, t.creatorHub)}
                </span>
              </td>
              <td className="pe-5 text-end font-mono tabular-nums sm:pe-3">{number.format(row.acquisitionCount)}</td>
              <td className="hidden whitespace-nowrap pe-5 text-end font-mono text-muted-foreground md:table-cell">
                <time dateTime={row.updatedAt} title={fullDate.format(new Date(row.updatedAt))}>
                  {formatRelative(row.updatedAt, now, localeTag)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyListings({ title, cta, href }: { title: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center gap-4 border-t border-border/60 px-5 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground" aria-hidden>
        <Store className="size-4" />
      </span>
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link href={href} className={buttonVariants({ variant: "primary", size: "sm" })}>
        {cta}
      </Link>
    </div>
  );
}

function ListingsSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-[33px] border-y border-border/60" />
      {Array.from({ length: ROW_COUNT_WHILE_LOADING }, (_, index) => (
        <div key={index} className="flex h-12 items-center gap-4 border-b border-border/60 px-5 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}
