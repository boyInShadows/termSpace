"use client";

import { useEffect, useState } from "react";
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
  className,
  children,
}: {
  id?: string;
  titleId: string;
  title?: string;
  description?: React.ReactNode;
  tone?: "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(settingsPanelClass, tone === "danger" && "border-destructive/40", className)}
    >
      {title && <h3 id={titleId} className="text-base font-semibold">{title}</h3>}
      {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}

/** A named group of panels and the target of one section-index link. */
export function SettingsGroup({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** In-page links to the groups: a wrapping row on phones, a sticky column from `lg`. */
export function SectionIndex({ label, items }: { label: string; items: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // A group is current while it crosses a band just under the header.
    const observer = new IntersectionObserver((entries) => {
      // The last group may be too short to ever reach the band.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const visible = entries.find((entry) => entry.isIntersecting);
      if (atEnd) setActive(ids.split(",").at(-1));
      else if (visible) setActive(visible.target.id);
    }, { rootMargin: "-15% 0px -75% 0px" });
    for (const id of ids.split(",")) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);

  return (
    <nav aria-label={label} className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
      <p aria-hidden className="hidden px-3 pb-2 text-xs font-semibold text-muted-foreground lg:block">{label}</p>
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex min-h-11 items-center rounded-nav px-3 text-sm lg:min-h-9",
                active === item.id ? "bg-primary-soft font-medium text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
