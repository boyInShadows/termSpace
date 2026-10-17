"use client";

import { useId } from "react";
import { useLocale } from "@/lib/locale-context";
import { intlLocale } from "@/lib/format";
import { useReleaseSelection } from "@/features/product/release-selection";

/**
 * Pick the release to inspect and add. Newest first; the first entry is the
 * current version.
 */
export function VersionPicker() {
  const { fa, locale } = useLocale();
  const id = useId();
  const selection = useReleaseSelection();
  const selected = selection?.selected;
  if (!selection || !selected) return null;

  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(selected.releasedAt));
  return (
    <div>
      <label htmlFor={id} className="eyebrow">{fa ? "نسخه" : "Version"}</label>
      <select
        id={id}
        value={selected.id}
        onChange={(event) => selection.select(event.target.value)}
        className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
        dir="ltr"
      >
        {selection.versions.map((version, index) => (
          <option key={version.id} value={version.id}>
            v{version.version}
            {index === 0 ? (fa ? " · جدیدترین" : " · latest") : ""}
          </option>
        ))}
      </select>
      <div className="mt-3" aria-live="polite">
        <p className="text-xs font-semibold">
          {fa ? "تغییرات" : "What changed"} <span className="font-normal text-muted-foreground">· {date}</span>
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{selected.notes}</p>
      </div>
    </div>
  );
}
