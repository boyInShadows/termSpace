"use client";
import Link from "next/link";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { SupportStatus } from "@/lib/support-api";
import { supportCopy, type SupportCopy } from "./support-copy";

export const supportField = "min-h-11 w-full rounded-control border-[length:0.0625rem] border-border-strong bg-surface px-3 py-2 text-base text-foreground focus-visible:outline-[0.125rem] focus-visible:outline-ring focus-visible:outline-offset-[0.125rem] disabled:opacity-60";
export const supportPanel = "rounded-card border-[length:0.0625rem] border-border bg-surface p-5 sm:p-6";

export function useSupportAccess() {
  const session = useMarketplaceSession();
  return session.emailVerified && session.marketplaceRoles.some(role => role === "administrator" || role === "moderator");
}

export function SupportSwitch({ inbox }: { inbox: boolean }) {
  const staff = useSupportAccess();
  const { locale } = useLocale(); const copy = supportCopy[locale];
  if (!staff) return null;
  return <nav aria-label={copy.title} className="mb-6 flex flex-wrap gap-2">
    {[[false, copy.mine], [true, copy.inbox]].map(([active, label]) => <Link key={String(active)}
      href={localePath(`/dashboard/tickets${active ? "/inbox" : ""}`, locale)} aria-current={inbox === active ? "page" : undefined}
      className={buttonVariants({ variant: inbox === active ? "secondary" : "ghost" })}>{label}</Link>)}
  </nav>;
}

export function TicketStatus({ status, inbox = false }: { status: SupportStatus; inbox?: boolean }) {
  const { locale } = useLocale(); const copy = supportCopy[locale];
  return <span className={`inline-flex items-center gap-2 text-xs font-medium ${status === "WAITING_FOR_SUPPORT" ? "text-primary" : "text-muted-foreground"}`}>
    <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${status === "WAITING_FOR_SUPPORT" ? "bg-primary" : "bg-current"}`} />
    {status === "WAITING_FOR_MEMBER" && inbox ? copy.staffWaiting : copy.statuses[status]}
  </span>;
}

export function TicketTime({ value }: { value: string }) {
  const { locale } = useLocale();
  return <time dateTime={value}>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))}</time>;
}

export function supportFailure(error: unknown, copy: SupportCopy, fallback = copy.error) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401 || error.status === 403) return copy.access;
  if (error.status === 404) return copy.notFound;
  if (error.code === "SUPPORT_CONFLICT") return copy.conflict;
  if (error.code === "SUPPORT_RESOLVED") return copy.staffResolved;
  if (error.status === 429) return copy.limited;
  if (error.code === "VALIDATION_ERROR") return copy.invalid;
  return error.status === 0 || error.status >= 500 ? fallback : error.message;
}

export function SupportError({ message, retry }: { message: string; retry?: () => void }) {
  const { locale } = useLocale();
  return <div className={`${supportPanel} space-y-3`}>
    <p role="alert" className="text-sm text-foreground">{message}</p>
    {retry && <Button variant="secondary" onClick={retry}>{supportCopy[locale].retry}</Button>}
  </div>;
}

export function SupportLoading() {
  const { locale } = useLocale();
  return <div role="status" className="space-y-3">
    <span className="sr-only">{supportCopy[locale].loading}</span>
    {[0, 1, 2].map(i => <div key={i} aria-hidden className={`${supportPanel} space-y-3`}>
      <div className="h-4 w-2/3 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" />
    </div>)}
  </div>;
}
