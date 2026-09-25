"use client";

import { useId, useState } from "react";
import type { ProductVersion } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";

/**
 * Pick a release and read what changed in it. Newest first; the first entry
 * is the current version.
 */
export function VersionPicker({ versions }: { versions: ProductVersion[] }) {
  const { fa } = useLocale();
  const id = useId();
  const [selectedId, setSelectedId] = useState(versions[0]?.id);
  const selected = versions.find((version) => version.id === selectedId) ?? versions[0];
  if (!selected) return null;

  const date = new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(selected.releasedAt));
  return (
    <div>
      <label htmlFor={id} className="eyebrow">{fa ? "نسخه" : "Version"}</label>
      <select
        id={id}
        value={selected.id}
        onChange={(event) => setSelectedId(event.target.value)}
        className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
        dir="ltr"
      >
        {versions.map((version, index) => (
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
