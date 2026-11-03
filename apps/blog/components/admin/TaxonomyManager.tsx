"use client";

import { useState } from "react";
import { useAdminAction } from "./use-admin-action";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Series, Tag } from "@/lib/types";

export function TaxonomyManager({ initialTags, initialSeries }: { initialTags: Tag[]; initialSeries: Series[] }) {
  const { busy, feedback, run } = useAdminAction();
  const [tags, setTags] = useState(initialTags);
  const [series, setSeries] = useState(initialSeries);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"tag" | "series">("tag");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const input = { name: name.trim(), slug: slugify(name), description: null };
      if (kind === "tag") {
        const response = await api.createTag(input);
        setTags((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const response = await api.createSeries(input);
        setSeries((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setName("");
    }, kind === "tag" ? "Tag created" : "Series created");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="flex flex-wrap gap-3 rounded-lg border border-line p-4">
        <label className="grid gap-2 text-sm font-medium">Type<select disabled={busy} value={kind} onChange={(event) => setKind(event.target.value as "tag" | "series")} className="rounded-lg border border-line-input px-3"><option value="tag">Tag</option><option value="series">Series</option></select></label>
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium">Name<input disabled={busy} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="w-full min-w-0 rounded-lg border border-line-input px-3 py-2" required /></label>
        <button disabled={busy} className="rounded-lg bg-action px-5 py-2 text-action-foreground hover:bg-action-hover">Add</button>
      </form>
      {feedback && <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}
      <div className="grid gap-8 md:grid-cols-2">
        <section><h3 className="mb-3 font-serif text-xl font-semibold">Tags</h3><ul className="space-y-2">{tags.map((tag) => <li key={tag.id} className="flex justify-between rounded border border-line p-3"><span>{tag.name}</span><button disabled={busy} onClick={() => void run(async () => { await api.deleteTag(tag.id); setTags((items) => items.filter((item) => item.id !== tag.id)); }, "Tag deleted")} className="text-sm text-red-700">Delete</button></li>)}</ul></section>
        <section><h3 className="mb-3 font-serif text-xl font-semibold">Series</h3><ul className="space-y-2">{series.map((item) => <li key={item.id} className="flex justify-between rounded border border-line p-3"><span>{item.name}</span><button disabled={busy} onClick={() => void run(async () => { await api.deleteSeries(item.id); setSeries((items) => items.filter((entry) => entry.id !== item.id)); }, "Series deleted")} className="text-sm text-red-700">Delete</button></li>)}</ul></section>
      </div>
    </div>
  );
}
