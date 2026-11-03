"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import type { MarkdownResource } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { useAdminAction } from "./use-admin-action";

const emptyForm = { title: "", slug: "", description: "", category: "", published: false };
type ResourceForm = typeof emptyForm;

export function ResourceManager({ initialResources }: { initialResources: MarkdownResource[] }) {
  const [resources, setResources] = useState(initialResources);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const { busy, feedback, run } = useAdminAction();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; values: ResourceForm } | null>(null);
  const [deleting, setDeleting] = useState<MarkdownResource | null>(null);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    const element = event.currentTarget;
    await run(async () => {
      const { data } = await api.uploadResource(file, form);
      setResources((current) => [data, ...current]);
      setForm(emptyForm); setFile(null); element.reset();
    }, "Resource uploaded");
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    await run(async () => {
      const { data } = await api.updateResource(editing.id, editing.values);
      setResources((current) => current.map((item) => item.id === data.id ? data : item));
      setEditing(null);
    }, "Resource updated");
  }

  async function togglePublished(resource: MarkdownResource) {
    await run(async () => {
      const { data } = await api.updateResource(resource.id, { published: !resource.published });
      setResources((current) => current.map((item) => item.id === data.id ? data : item));
    }, resource.published ? "Resource unpublished" : "Resource published");
  }

  async function remove() {
    if (!deleting) return;
    await run(async () => {
      await api.deleteResource(deleting.id);
      setResources((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    }, "Resource deleted");
  }

  function edit(resource: MarkdownResource) {
    setEditing({ id: resource.id, values: { title: resource.title, slug: resource.slug, description: resource.description, category: resource.category, published: resource.published } });
  }

  const fieldClass = "w-full min-w-0 rounded-lg border border-line-input bg-white px-3 py-2";
  return <div className="space-y-8">
    <form aria-label="Upload resource" onSubmit={upload} className="grid gap-4 rounded-xl border border-line bg-paper-card p-5 md:grid-cols-2">
      <div className="md:col-span-2"><label htmlFor="resource-file" className="mb-1 block text-sm font-medium">Markdown file (maximum 1 MB)</label><input disabled={busy} id="resource-file" className="w-full min-w-0" type="file" accept=".md,text/markdown,text/plain" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Title<input disabled={busy} required minLength={3} maxLength={160} placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Slug<input disabled={busy} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="slug-like-this" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className={fieldClass} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Category<input disabled={busy} required minLength={2} maxLength={80} placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={fieldClass} /></label>
      <label className="flex items-center gap-2 text-sm"><input disabled={busy} type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publish immediately</label>
      <label className="grid min-w-0 gap-2 text-sm font-medium md:col-span-2">Short description<textarea disabled={busy} required minLength={10} maxLength={500} placeholder="Short description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClass} /></label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2"><button disabled={busy} className="rounded-lg bg-accent px-5 py-2 text-paper">Upload resource</button></div>
    </form>

    {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className="text-sm">{feedback.text}</p>}
    <div className="space-y-4">{resources.map((resource) => <article key={resource.id} className="rounded-xl border border-line bg-paper-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="font-serif text-xl font-semibold">{resource.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${resource.published ? "bg-green-100 text-green-800" : "bg-paper-warm text-ink-muted"}`}>{resource.published ? "Published" : "Draft"}</span></div><p className="mt-1 text-sm text-ink-soft">{resource.category} · {resource.fileName} · {Math.max(1, Math.ceil(resource.size / 1024))} KB</p><p className="mt-2 max-w-3xl text-sm text-ink-muted">{resource.description}</p></div><div className="flex flex-wrap gap-3 text-sm"><button disabled={busy} onClick={() => setPreviewId(previewId === resource.id ? null : resource.id)} className="text-accent">{previewId === resource.id ? "Close preview" : "Preview"}</button><button disabled={busy} onClick={() => edit(resource)} className="text-accent">Edit details</button><button disabled={busy} onClick={() => void togglePublished(resource)} className="text-accent">{resource.published ? "Unpublish" : "Publish"}</button><button disabled={busy} onClick={() => setDeleting(resource)} className="text-red-700">Delete</button></div></div>
      {editing?.id === resource.id && <form aria-label="Edit resource" onSubmit={saveEdit} className="mt-5 grid gap-3 rounded-lg border border-line bg-paper-warm p-4 md:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Title<input disabled={busy} required value={editing.values.title} onChange={(event) => setEditing({ ...editing, values: { ...editing.values, title: event.target.value } })} className={fieldClass} /></label><label className="grid min-w-0 gap-2 text-sm font-medium">Slug<input disabled={busy} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={editing.values.slug} onChange={(event) => setEditing({ ...editing, values: { ...editing.values, slug: event.target.value } })} className={fieldClass} /></label><label className="grid min-w-0 gap-2 text-sm font-medium">Category<input disabled={busy} required value={editing.values.category} onChange={(event) => setEditing({ ...editing, values: { ...editing.values, category: event.target.value } })} className={fieldClass} /></label><label className="grid min-w-0 gap-2 text-sm font-medium">Short description<textarea disabled={busy} required minLength={10} value={editing.values.description} onChange={(event) => setEditing({ ...editing, values: { ...editing.values, description: event.target.value } })} className={fieldClass} /></label><div className="flex gap-3 md:col-span-2"><button disabled={busy} className="rounded-md bg-accent px-4 py-2 text-sm text-white">Save details</button><button disabled={busy} type="button" onClick={() => setEditing(null)} className="rounded-md border border-line px-4 py-2 text-sm">Cancel</button></div></form>}
      {previewId === resource.id && resource.content && <div className="prose-article mt-6 max-h-[32rem] overflow-auto rounded-lg border border-line bg-white p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.content) }} />}
    </article>)}{resources.length === 0 && <p className="text-sm text-ink-muted">No Markdown resources uploaded yet.</p>}</div>
    <ConfirmDialog error={feedback?.kind === "error" ? feedback.text : undefined} busy={busy} open={Boolean(deleting)} title="Delete resource?" description={`This permanently removes “${deleting?.title ?? "this resource"}”.`} confirmLabel="Delete resource" onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
  </div>;
}
