"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { NewsletterCampaign } from "@/lib/types";

export function NewsletterManager({ initialCampaigns, articles }: { initialCampaigns: NewsletterCampaign[]; articles: { id: string; title: string }[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");
  const [articleId, setArticleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() { setCampaigns((await api.listNewsletterCampaigns()).data); }

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api.createNewsletterCampaign({ subject: subject.trim() || undefined, previewText: previewText.trim() || undefined, body: body.trim() || undefined, articleId: articleId || undefined });
      await refresh(); setSubject(""); setPreviewText(""); setBody(""); setArticleId(""); setMessage("Campaign draft created.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create campaign"); }
    finally { setBusy(false); }
  }

  async function send(id: string) {
    if (!window.confirm("Queue this campaign for every active subscriber? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try { const result = await api.queueNewsletterCampaign(id); await refresh(); setMessage(`${result.data.queued} recipient emails queued.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not queue campaign"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-ink-soft">Delivery counts are provider-accepted, failed, pending, or cancelled. Opens are not tracked.</p><a href="/backend/api/newsletter/admin/subscribers/export" className="rounded border border-line px-4 py-2 text-sm text-accent">Export subscribers CSV</a></div>
    <form onSubmit={create} className="space-y-4 rounded-xl border border-line bg-paper-card p-6"><h2 className="font-serif text-2xl font-semibold">New campaign</h2>
      <label className="block text-sm">Published article (optional)<select value={articleId} onChange={(event) => setArticleId(event.target.value)} className="mt-1 w-full rounded border border-line p-2"><option value="">Standalone newsletter</option>{articles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="block text-sm">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="Uses article title when omitted" className="mt-1 w-full rounded border border-line p-2" /></label>
      <label className="block text-sm">Preview text<input value={previewText} onChange={(event) => setPreviewText(event.target.value)} maxLength={300} className="mt-1 w-full rounded border border-line p-2" /></label>
      <label className="block text-sm">Email body<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={20_000} rows={8} placeholder="Uses the article body when omitted" className="mt-1 w-full rounded border border-line p-2" /></label>
      <button disabled={busy} className="rounded bg-accent px-5 py-2 text-paper disabled:opacity-50">Save draft</button>
    </form>
    <p role="status" className="text-sm text-ink-soft">{message}</p>
    <section><h2 className="font-serif text-2xl font-semibold">Campaigns</h2><div className="mt-4 space-y-3">{campaigns.map((item) => <article key={item.id} className="rounded-lg border border-line bg-paper-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.subject}</h3><p className="text-xs text-ink-muted">{item.article?.title ?? "Standalone"} · {item.status} · {new Date(item.createdAt).toLocaleDateString()}</p></div>{item.status === "DRAFT" && <button type="button" disabled={busy} onClick={() => void send(item.id)} className="rounded bg-accent px-4 py-2 text-sm text-paper disabled:opacity-50">Queue send</button>}</div><p className="mt-3 text-sm text-ink-soft">Accepted {item.delivery.SENT ?? 0} · Pending {(item.delivery.PENDING ?? 0) + (item.delivery.RETRY ?? 0) + (item.delivery.PROCESSING ?? 0)} · Failed {item.delivery.FAILED ?? 0} · Cancelled {item.delivery.CANCELLED ?? 0}</p></article>)}</div></section>
  </div>;
}
