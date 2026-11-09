"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { supportCopy } from "./support-copy";

function LocalPreview({ file, label }: { file: File; label: string }) {
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (preview.current) preview.current.style.backgroundImage = `url("${url}")`;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div ref={preview} role="img" aria-label={label} className="h-28 bg-contain bg-center bg-no-repeat" />;
}

export function ScreenshotPicker({ files, onChange, disabled, locale }: {
  files: File[]; onChange: (files: File[]) => void; disabled: boolean; locale: Locale;
}) {
  const c = supportCopy[locale];
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  return <div className="space-y-3">
    <label htmlFor={id} className="block font-medium">{c.screenshots}</label>
    <Input id={id} type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={disabled}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} onChange={event => {
        const selected = [...files, ...Array.from(event.currentTarget.files ?? [])];
        event.currentTarget.value = "";
        if (selected.length > 3 || selected.some(file => file.size > 5 * 1024 * 1024) || selected.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) {
          setError(c.imageLimit); return;
        }
        if (selected.some(file => !["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
          setError(c.invalidImage); return;
        }
        setError(null); onChange(selected);
      }} />
    <p id={`${id}-help`} className="text-sm leading-6 text-muted-foreground">{c.screenshotHelp}</p>
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    {files.length > 0 && <ul className="grid gap-3 sm:grid-cols-3">
      {files.map((file, index) => <li key={`${file.name}:${file.lastModified}:${index}`} className="min-w-0 rounded-control border border-border p-3">
        <LocalPreview file={file} label={`${c.screenshot} ${index + 1}`} />
        <p className="my-2 truncate text-sm" title={file.name}><bdi>{file.name}</bdi></p>
        <Button type="button" variant="secondary" disabled={disabled} aria-label={`${c.removeScreenshot} ${index + 1}`}
          onClick={() => { onChange(files.filter((_, position) => position !== index)); setError(null); }}>{c.removeScreenshot}</Button>
      </li>)}
    </ul>}
  </div>;
}
