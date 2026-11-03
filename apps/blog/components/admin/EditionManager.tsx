"use client";

import { useState } from "react";
import { useAdminAction } from "./use-admin-action";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { ArticleSummary, Edition, EditionInput } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";

const empty: EditionInput = { number: 1, title: "", slug: "", description: "", editorialNote: "", coverImage: "", accentColor: "#b45309", published: false, articleIds: [] };

export function EditionManager({ initialEditions, articles }: { initialEditions: Edition[]; articles: ArticleSummary[] }) {
  const [editions, setEditions] = useState(initialEditions);
  const [form, setForm] = useState<EditionInput>({ ...empty, number: Math.max(0, ...initialEditions.map((item) => item.number)) + 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Edition | null>(null);
  const { busy, feedback, run } = useAdminAction();

  function toggleArticle(id: string) {
    setForm((current) => ({ ...current, articleIds: current.articleIds.includes(id) ? current.articleIds.filter((item) => item !== id) : [...current.articleIds, id] }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const response = editingId ? await api.updateEdition(editingId, form) : await api.createEdition(form);
      setEditions((current) => [response.data, ...current.filter((item) => item.id !== response.data.id)].sort((a, b) => b.number - a.number));
      setEditingId(null); setForm({ ...empty, number: Math.max(form.number, ...editions.map((item) => item.number)) + 1 });
    }, "Edition saved");
  }

  function edit(edition: Edition) {
    setEditingId(edition.id);
    setForm({ number: edition.number, title: edition.title, slug: edition.slug, description: edition.description, editorialNote: edition.editorialNote ?? "", coverImage: edition.coverImage ?? "", accentColor: edition.accentColor, published: edition.published, articleIds: edition.articles.map((article) => article.id) });
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  async function remove() {
    if (!deleting) return;
    await run(async () => {
      await api.deleteEdition(deleting.id);
      setEditions((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null);
    }, "Edition deleted");
  }

  const inputClass = "rounded-lg border border-line-input bg-white px-3 py-2";
  return <div className="space-y-8"><form onSubmit={save} className="grid gap-4 rounded-xl border border-line bg-paper-card p-5 md:grid-cols-2"><div><label htmlFor="edition-number" className="mb-1 block text-sm font-medium">Edition number</label><input disabled={busy} id="edition-number" type="number" min="1" required value={form.number} onChange={(event) => setForm({ ...form, number: Number(event.target.value) })} className={`w-full ${inputClass}`} /></div><div><label htmlFor="edition-title" className="mb-1 block text-sm font-medium">Title</label><input disabled={busy} id="edition-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, slug: editingId ? form.slug : slugify(event.target.value) })} className={`w-full ${inputClass}`} /></div><div><label htmlFor="edition-slug" className="mb-1 block text-sm font-medium">Slug</label><input disabled={busy} id="edition-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className={`w-full ${inputClass}`} /></div><div><label htmlFor="edition-accentColor" className="mb-1 block text-sm font-medium">Accent color</label><input disabled={busy} id="edition-accentColor" type="color" value={form.accentColor} onChange={(event) => setForm({ ...form, accentColor: event.target.value })} className="h-11 w-full rounded-lg border border-line-input bg-white p-1" /></div><div className="md:col-span-2"><label htmlFor="edition-coverImage" className="mb-1 block text-sm font-medium">Cover image URL</label><input disabled={busy} id="edition-coverImage" type="url" value={form.coverImage ?? ""} onChange={(event) => setForm({ ...form, coverImage: event.target.value || null })} className={`w-full ${inputClass}`} /></div><div className="md:col-span-2"><label htmlFor="edition-description" className="mb-1 block text-sm font-medium">Description</label><textarea disabled={busy} id="edition-description" required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`w-full ${inputClass}`} /></div><div className="md:col-span-2"><label htmlFor="edition-editorialNote" className="mb-1 block text-sm font-medium">Editor&apos;s note</label><textarea disabled={busy} id="edition-editorialNote" rows={4} value={form.editorialNote ?? ""} onChange={(event) => setForm({ ...form, editorialNote: event.target.value })} className={`w-full ${inputClass}`} /></div><fieldset className="md:col-span-2"><legend className="text-sm font-medium">Articles in reading order</legend><p className="mt-1 text-xs text-ink-muted">Select articles in the order they should appear.</p><div className="mt-3 grid max-h-72 gap-2 overflow-auto rounded-lg border border-line bg-white p-3 md:grid-cols-2">{articles.map((article) => <label key={article.id} className="flex gap-2 rounded p-2 text-sm hover:bg-paper-warm"><input disabled={busy} type="checkbox" checked={form.articleIds.includes(article.id)} onChange={() => toggleArticle(article.id)} /><span>{article.title}</span></label>)}</div></fieldset><label className="flex items-center gap-2 text-sm"><input disabled={busy} type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publish edition</label><div className="flex flex-wrap items-center justify-end gap-3"><button disabled={busy} className="rounded-lg bg-accent px-5 py-2 text-white">{editingId ? "Update edition" : "Create edition"}</button>{editingId && <button disabled={busy} type="button" onClick={() => { setEditingId(null); setForm({ ...empty, number: Math.max(0, ...editions.map((item) => item.number)) + 1 }); }} className="rounded-lg border border-line px-4 py-2">Cancel</button>}</div>{feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className="text-sm md:col-span-2">{feedback.text}</p>}</form><div className="space-y-4">{editions.map((edition) => <article key={edition.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-paper-card p-5" style={{ borderLeftColor: edition.accentColor, borderLeftWidth: 4 }}><div><p className="text-xs uppercase tracking-widest text-ink-muted">Edition {String(edition.number).padStart(2, "0")} · {edition.published ? "Published" : "Draft"}</p><h3 className="mt-1 font-serif text-xl font-semibold">{edition.title}</h3><p className="mt-1 text-sm text-ink-muted">{edition.articles.length} articles</p></div><div className="flex gap-3 text-sm"><button disabled={busy} onClick={() => edit(edition)} className="text-accent">Edit</button><button disabled={busy} onClick={() => setDeleting(edition)} className="text-red-700">Delete</button></div></article>)}</div><ConfirmDialog error={feedback?.kind === "error" ? feedback.text : undefined} busy={busy} open={Boolean(deleting)} title="Delete edition?" description={`This removes “${deleting?.title ?? "this edition"}”. Articles will not be deleted.`} confirmLabel="Delete edition" onConfirm={() => void remove()} onCancel={() => setDeleting(null)} /></div>;
}
