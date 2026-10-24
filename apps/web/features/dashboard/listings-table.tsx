"use client";
import { Fragment } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { isEditable, listingStateLabel, formatRelative, listingTone, listingStatusClass, OVERVIEW_LISTING_LIMIT } from "@/lib/dashboard";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { CreatorDashboardListing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CardError, DashboardCard, Skeleton } from "./dashboard-card";
import type { OverviewState } from "./overview-state";
import { formatNumber, intlLocale } from "@/lib/format";
import { ContextHelp } from "@/components/ui/context-help";

const HEAD_CELL = "py-2 font-normal";
const ROW_COUNT_WHILE_LOADING = 5;

export function ListingsTable({ state, now, onRetry }: { state: OverviewState; now: number; onRetry: () => void }) {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const viewAll = (
    <Link href={localePath("/dashboard/studio", locale)} className="inline-flex min-h-8 items-center text-sm text-primary transition-colors hover:text-primary-hover">
      {copy.viewAll} <span aria-hidden>{locale === "fa" ? "←" : "→"}</span>
    </Link>
  );

  return (
    <DashboardCard title={copy.listingsTitle} action={<div className="flex items-center gap-2">{viewAll}<ContextHelp label={copy.listingsTitle} topic="publication" /></div>}>
      {state.status === "loading" && <ListingsSkeleton />}
      {state.status === "error" && <CardError onRetry={onRetry} />}
      {state.status === "ready" && state.home.kind === "no-profile" && (
        <EmptyListings title={copy.noProfile} cta={copy.noProfileCta} href={localePath("/dashboard/studio", locale)} />
      )}
      {state.status === "ready" && state.home.kind === "creator" && (
        state.home.dashboard.listings.length === 0 ? (
          <EmptyListings
            title={copy.emptyListings}
            cta={copy.emptyListingsCta}
            href={localePath("/dashboard/studio/listings/new", locale)}
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
  const localeTag = intlLocale(locale);
  const fullDate = new Intl.DateTimeFormat(localeTag, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="overflow-x-auto">
      <table role="table" className="w-full text-sm max-sm:block">
        <thead className="max-sm:sr-only font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground rtl:font-sans rtl:text-xs rtl:tracking-normal">
          <tr className="border-y border-border/60">
            <th scope="col" className={cn(HEAD_CELL, "ps-5 text-start")}>{copy.colName}</th>
            <th scope="col" className={cn(HEAD_CELL, "hidden text-start sm:table-cell")}>{copy.colVersion}</th>
            <th scope="col" className={cn(HEAD_CELL, "px-3 text-start")}>{copy.colStatus}</th>
            <th scope="col" className={cn(HEAD_CELL, "pe-5 text-end max-sm:tracking-normal sm:pe-3")}>{copy.colAcquisitions}</th>
            <th scope="col" className={cn(HEAD_CELL, "hidden pe-5 text-end md:table-cell")}>{copy.colUpdated}</th>
          </tr>
        </thead>
        <tbody className="max-sm:block">
          {rows.map((row) => {
            // What the reviewer asked for, on the row that needs the creator:
            // the overview is where they land, and the status pill alone left
            // "Changes requested" a dead end.
            const feedback = listingTone(row.state) === "attention" ? row.moderationFeedback?.message : null;
            return (
              <Fragment key={row.id}>
                <tr className={cn("transition-colors hover:bg-surface-raised/60 max-sm:grid max-sm:grid-cols-2 sm:h-12", !feedback && "border-b border-border/60 last:border-0")}>
                  {/* `w-full max-w-0` is the table-cell truncation idiom: the name
                      takes whatever the other columns leave. Without `w-full` the
                      cell collapsed to nothing on a phone and only the type badge
                      showed. */}
                  <td className="ps-5 max-sm:col-span-2 max-sm:pe-5 max-sm:py-2 sm:w-auto sm:max-w-none">
                    <Link
                      href={localePath(`/dashboard/studio/listings/${row.id}/releases`, locale)}
                      className="flex min-h-8 min-w-0 flex-col items-start justify-center gap-1 py-1.5 sm:flex-row sm:items-center sm:gap-2 sm:py-0"
                    >
                      <span className="max-w-full break-words font-medium sm:truncate" title={row.name}>{row.name}</span>
                      <span className="shrink-0 rounded-none bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] uppercase text-foreground/80">
                        {row.type}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden font-mono text-muted-foreground sm:table-cell">
                    <bdi dir="ltr">v{row.currentVersion}</bdi>
                  </td>
                  <td className="px-3 max-sm:pb-3 max-sm:ps-5">
                    <span className={cn("inline-block max-w-[6.5rem] px-2 py-0.5 text-center text-xs leading-4 sm:max-w-none sm:whitespace-nowrap", listingStatusClass(row.state))}>
                      {listingStateLabel(row.state, t.creatorHub)}
                    </span>
                  </td>
                  <td className="pe-5 text-end font-mono tabular-nums max-sm:pb-3 sm:pe-3"><span className="me-2 font-sans text-xs text-muted-foreground sm:hidden">{copy.colAcquisitions}</span>{formatNumber(row.acquisitionCount, locale)}</td>
                  <td className="hidden whitespace-nowrap pe-5 text-end font-mono text-muted-foreground md:table-cell">
                    <time dateTime={row.updatedAt} title={fullDate.format(new Date(row.updatedAt))}>
                      {formatRelative(row.updatedAt, now, localeTag)}
                    </time>
                  </td>
                </tr>
                {feedback && (
                  <tr className="border-b border-border/60 last:border-0 max-sm:block">
                    <td colSpan={5} className="px-5 pb-3 max-sm:block">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <p className="ts-bidi min-w-0 line-clamp-3 text-xs leading-5 text-muted-foreground" title={feedback}>
                          <span className="font-semibold text-foreground">{t.creatorHub.moderationFeedback}: </span>
                          {feedback}
                        </p>
                        {isEditable(row.state) && (
                          <Link
                            href={localePath(`/dashboard/studio/listings/${row.id}/edit`, locale)}
                            className="inline-flex min-h-8 shrink-0 items-center text-xs font-semibold text-primary hover:underline"
                          >
                            {t.creatorHub.editDraft}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyListings({ title, cta, href }: { title: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center gap-4 border-t border-border/60 px-5 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-none border border-border text-muted-foreground" aria-hidden>
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
