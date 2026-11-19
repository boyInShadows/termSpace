"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Focused controls must clear the sticky header above and the fixed phone tab bar below. */
export const settingsPanelClass =
  "rounded-card border border-border bg-surface p-5 sm:p-6 [&_:is(input,textarea,button,a)]:scroll-mt-32 [&_:is(input,textarea,button,a)]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]";

/** The one frame every Profile panel uses. Without a `title` the children supply the labelled heading. */
export function SettingsPanel({
  id,
  titleId,
  title,
  description,
  tone,
  action,
  className,
  children,
}: {
  id?: string;
  titleId: string;
  title?: string;
  description?: React.ReactNode;
  tone?: "danger";
  /** A control beside the title that acts on the whole panel, such as Edit. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(settingsPanelClass, tone === "danger" && "border-destructive/40", className)}
    >
      {(title || action) && <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title && <h3 id={titleId} className={cn("text-base font-semibold", tone === "danger" && "text-destructive")}>{title}</h3>}
          {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>}
      {!title && !action && description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}

/**
 * One setting: its name, its current value and the action that changes it. The form
 * that makes the change (`children`) opens beneath the row instead of sitting open.
 */
export function SettingRow({ label, labelId, value, description, action, children }: {
  label: string;
  labelId?: string;
  /** A current value, aligned in a column beside the label. */
  value?: React.ReactNode;
  /** An explanation of an action row, set under the label instead of in the value column. */
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {description !== undefined ? <div className="min-w-0 flex-1 basis-64">
          <p id={labelId} className="text-sm font-medium">{label}</p>
          <div className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</div>
        </div> : <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
          <p id={labelId} className="text-sm font-medium">{label}</p>
          {value !== undefined && <div className="mt-1 min-w-0 text-sm text-muted-foreground sm:mt-0">{value}</div>}
        </div>}
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Returns the ref for the button that opens a row's form. When `open` turns false (Cancel or a
 * successful save), focus goes back to that button instead of dropping to the page.
 */
export function useReturnFocus<T extends HTMLElement = HTMLButtonElement>(open: boolean) {
  const trigger = useRef<T>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return trigger;
}

/** Rows inside a panel, separated by hairlines. */
export function SettingRows({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-5 divide-y divide-border border-t border-border pt-4", className)}>{children}</div>;
}

/**
 * One section of the settings page. Inactive sections stay mounted but hidden, so
 * a half-filled form and its loaded data survive switching to another section.
 */
export function SettingsGroup({ id, title, intro, active, children }: {
  id: string;
  title: string;
  intro?: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} hidden={!active}>
      <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
      {intro && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{intro}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export type SettingsSection = { id: string; title: string; icon: LucideIcon };

/** Section links: a scrolling chip row on phones, a sticky column from `lg`. */
export function SettingsNav({ label, items, current, hrefFor }: {
  label: string;
  items: SettingsSection[];
  current: string;
  hrefFor: (id: string) => string;
}) {
  const list = useRef<HTMLUListElement>(null);
  // On phones the chip row scrolls sideways; keep the current section's chip in view, including
  // after Connections joins the row once the creator profile loads.
  const count = items.length;
  useEffect(() => {
    const element = list.current;
    const chip = element?.querySelector<HTMLElement>("[aria-current]");
    if (!element || !chip || element.scrollWidth <= element.clientWidth) return;
    // Scroll the row only, never the page, so a deep link still opens at the top.
    const row = element.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    if (box.left < row.left) element.scrollLeft -= row.left - box.left;
    else if (box.right > row.right) element.scrollLeft += box.right - row.right;
  }, [current, count]);

  return (
    <nav aria-label={label} className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
      <ul ref={list} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {items.map(({ id, title, icon: Icon }) => {
          const active = current === id;
          return (
            <li key={id} className="shrink-0">
              <Link
                href={hrefFor(id)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                // Chrome leaves a partly hidden chip clipped on Tab in RTL; bring it fully into the row.
                onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
                className={cn(
                  // Width, not colour: the unlayered `* { border-color }` reset outranks colour utilities.
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-chip border px-4 text-sm motion-safe:transition-colors lg:min-h-10 lg:rounded-nav lg:border-0 lg:px-3",
                  active
                    ? "bg-primary-soft font-medium text-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-surface",
                )}
              >
                <Icon aria-hidden="true" className={cn("size-4 shrink-0", active && "text-primary")} />
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
