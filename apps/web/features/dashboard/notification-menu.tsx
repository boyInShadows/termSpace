"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getMarketplaceNotifications, markMarketplaceNotificationsRead, type ModerationNotification } from "@/lib/notification-api";
import { intlLocale } from "@/lib/format";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { notificationsCopy } from "./notifications-copy";

type State =
  | { status: "loading"; unread: number; items: ModerationNotification[] }
  | { status: "error"; unread: number; items: ModerationNotification[] }
  | { status: "ready"; unread: number; items: ModerationNotification[] };

const iconByType = {
  approved: CheckCircle2,
  changes_requested: CircleAlert,
  rejected: XCircle,
} as const;

const toneByType = {
  approved: "text-verified",
  changes_requested: "text-warning",
  rejected: "text-destructive",
} as const;

/**
 * A disclosure, not an ARIA menu: the trigger shows the decision feed and
 * Escape or a click elsewhere closes it. The badge is fetched once per mount
 * and again whenever the panel opens, so a decision made in another tab shows
 * up without a page reload.
 */
export function NotificationMenu() {
  const { locale } = useLocale();
  const copy = notificationsCopy[locale];
  const pathname = usePathname();
  const [state, setState] = useState<State>({ status: "loading", unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<{ text: string; failed: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const loadedRef = useRef(false);
  const panelId = useId();

  useEffect(() => {
    const controller = new AbortController();
    void getMarketplaceNotifications(controller.signal)
      .then(({ unread, notifications }) => {
        if (!controller.signal.aborted) {
          loadedRef.current = true;
          setState({ status: "ready", unread, items: notifications });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((current) => current.status === "ready" ? current : { status: "error", unread: 0, items: [] });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    // Refresh a loaded feed when the panel opens; do not race a failed load's
    // Retry button by replacing its error state automatically.
    if (open && loadedRef.current) setAttempt((value) => value + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (target: EventTarget | null) => !rootRef.current?.contains(target as Node | null);
    const onPointerDown = (event: PointerEvent) => { if (outside(event.target)) setOpen(false); };
    const onFocusIn = (event: FocusEvent) => { if (outside(event.target)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    // The root layout persists across dashboard routes; an open panel must not.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  async function markAll() {
    if (state.status !== "ready" || state.unread === 0 || marking) return;
    setMarking(true);
    setResult(null);
    try {
      await markMarketplaceNotificationsRead();
      setState((current) => ({ ...current, unread: 0, items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) }));
      setResult({ text: copy.markedAll, failed: false });
    } catch {
      setResult({ text: copy.markAllFailed, failed: true });
    } finally {
      setMarking(false);
    }
  }

  function rememberRead(id: string) {
    setState((current) => {
      const item = current.items.find((entry) => entry.id === id);
      if (!item || item.readAt) return current;
      return { ...current, unread: Math.max(0, current.unread - 1), items: current.items.map((entry) => entry.id === id ? { ...entry, readAt: new Date().toISOString() } : entry) };
    });
    void markMarketplaceNotificationsRead([id]).catch(() => {});
  }

  const unread = state.unread;
  const triggerLabel = unread > 0 ? `${copy.label} (${copy.unread(unread)})` : copy.label;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        title={copy.label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => { setOpen((value) => !value); setResult(null); }}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute -top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-chip bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div id={panelId} data-notifications className="absolute end-0 top-full z-50 mt-2 w-[min(92vw,22rem)] rounded-card border border-border bg-surface p-1 shadow-panel">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <h2 className="text-sm font-semibold">{copy.title}</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAll()}
                disabled={marking}
                className="inline-flex min-h-8 items-center text-xs font-semibold text-primary disabled:opacity-60"
              >
                {marking ? copy.markingAll : copy.markAllRead}
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
            {state.status === "loading" ? (
              <p role="status" className="px-3 py-6 text-sm text-muted-foreground">{copy.loading}</p>
            ) : state.status === "error" ? (
              <div className="px-3 py-5">
                <p role="alert" className="text-sm text-destructive">{copy.loadError}</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-2 inline-flex min-h-8 items-center text-sm font-semibold text-primary">
                  {copy.retry}
                </button>
              </div>
            ) : state.items.length === 0 ? (
              <p className="px-3 py-6 text-sm leading-6 text-muted-foreground">{copy.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {state.items.map((item) => {
                  const Icon = iconByType[item.type];
                  return (
                    <li key={item.id}>
                      <Link
                        href={localePath("/dashboard/studio", locale)}
                        onClick={() => rememberRead(item.id)}
                        className={cn(
                          "flex min-h-11 gap-3 px-3 py-3 transition-colors hover:bg-muted focus-visible:bg-muted",
                          !item.readAt && "bg-primary-soft/40",
                        )}
                      >
                        <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", toneByType[item.type])} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <span className="ts-bidi min-w-0 break-words text-sm font-semibold">{item.productName}</span>
                            <time dateTime={item.createdAt} className="text-[11px] text-muted-foreground">
                              {new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric" }).format(new Date(item.createdAt))}
                            </time>
                          </span>
                          <span className="mt-0.5 block text-xs font-medium text-foreground">{copy[item.type]}</span>
                          {item.publicReason && (
                            <span className="ts-bidi mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                              {copy.reviewerNote}: {item.publicReason}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {result && (
            <p role={result.failed ? "alert" : "status"} className={cn("border-t border-border px-3 py-2 text-xs", result.failed ? "text-destructive" : "text-muted-foreground")}>
              {result.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
