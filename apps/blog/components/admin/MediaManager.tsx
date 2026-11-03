"use client";

import { useState } from "react";
import { useAdminAction } from "./use-admin-action";
import { api } from "@/lib/api";
import type { MediaAsset } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE } from "@/lib/images";

export function MediaManager({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const { busy, feedback, run } = useAdminAction();
  const [width, setWidth] = useState("2000");
  const [height, setHeight] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !altText.trim()) return;
    const element = event.currentTarget;
    await run(async () => {
      const response = await api.uploadMedia(file, altText.trim(), { width: Number(width) || undefined, height: Number(height) || undefined });
      setAssets((current) => [response.data, ...current]);
      setFile(null); setAltText(""); element.reset();
    }, "Upload complete");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={upload} className="grid gap-3 rounded-xl border border-line bg-paper-card p-5 md:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-medium">Image file<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
        <label className="grid min-w-0 gap-2 text-sm font-medium">Descriptive alt text<input disabled={busy} value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Descriptive alt text" className="min-w-0 rounded-lg border border-line-input px-3 py-2" required /></label>
        <div className="flex flex-wrap gap-3 md:col-span-2"><input disabled={busy} type="number" min="320" max="2400" value={width} onChange={(event) => setWidth(event.target.value)} aria-label="Output width" className="w-full min-w-0 rounded border sm:w-32 border-line-input px-3 py-2" /><input disabled={busy} type="number" min="200" max="2400" value={height} onChange={(event) => setHeight(event.target.value)} aria-label="Crop height" placeholder="Auto height" className="w-full min-w-0 rounded border sm:w-32 border-line-input px-3 py-2" /><button disabled={busy} className="rounded-lg bg-action px-5 py-2 text-action-foreground hover:bg-action-hover">Upload</button></div>
        {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className="text-sm md:col-span-2">{feedback.text}</p>}
      </form>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-lg border border-line bg-paper-card">
            <div className="relative aspect-video"><SafeImage src={asset.url} fallback={ARTICLE_FALLBACK_IMAGE} alt={asset.altText} fill className="object-cover" /></div>
            <div className="space-y-2 p-4"><p className="text-sm font-medium">{asset.altText}</p><p className="truncate text-xs text-ink-muted">{asset.url}</p>
              <div className="flex gap-3"><button disabled={busy} type="button" onClick={() => void run(() => navigator.clipboard.writeText(asset.url), "URL copied")} className="text-sm text-accent">Copy URL</button><button disabled={busy} type="button" onClick={() => void run(async () => { await api.deleteMedia(asset.id); setAssets((current) => current.filter((item) => item.id !== asset.id)); }, "Image deleted")} className="text-sm text-red-700">Delete</button></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
