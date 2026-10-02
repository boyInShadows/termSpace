"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

export function Comments({ slug, initialComments, locale = "en", prompt }: { slug: string; initialComments: Comment[]; locale?: "en" | "fa"; prompt?: string | null }) {
  const fa = locale === "fa";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [status, setStatus] = useState("");
  const children = new Map<string | null, Comment[]>();
  const ids = new Set(initialComments.map((item) => item.id));
  for (const comment of initialComments) {
    const key = ids.has(comment.parentId ?? "") ? comment.parentId : null;
    children.set(key, [...(children.get(key) ?? []), comment]);
  }

  function thread(parentId: string | null, depth = 0): React.ReactNode {
    return (children.get(parentId) ?? []).map((comment) => <li key={comment.id} className={depth > 0 && depth < 3 ? "ms-4 border-s-2 border-line ps-4" : depth >= 3 ? "border-s-2 border-line ps-2" : ""}>
      <article id={`comment-${comment.id}`} className="rounded-lg border border-line p-4">
        <div className="flex justify-between gap-2 text-sm"><strong>{comment.name}</strong><time className="text-ink-muted" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString(fa ? "fa-IR" : "en")}</time></div>
        <p className="mt-2 whitespace-pre-wrap text-ink-soft">{comment.body}</p>
        <button type="button" className="mt-2 text-sm text-accent" onClick={() => { setReplyTo(comment); document.getElementById("comment-body")?.focus(); }}>{fa ? "پاسخ" : "Reply"}</button>
      </article>
      {children.has(comment.id) && <ol className="mt-3 space-y-3">{thread(comment.id, depth + 1)}</ol>}
    </li>);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(fa ? "در حال ارسال…" : "Submitting…");
    try {
      const response = await api.submitComment(slug, { name, email, body, website, parentId: replyTo?.id });
      setStatus(response.data.message);
      setBody("");
      setReplyTo(null);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to submit comment"); }
  }

  return <section className="mx-auto max-w-3xl py-14"><h2 className="font-serif text-2xl font-semibold">{fa ? "گفت‌وگو" : "Discussion"}</h2>
    <ol className="mt-6 space-y-5">{thread(null)}</ol>
    {initialComments.length === 0 && <p className="mt-6 text-sm text-ink-muted">{fa ? "هنوز دیدگاه تأییدشده‌ای وجود ندارد." : "No approved comments yet."}</p>}
    <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-line bg-paper-card p-5"><h3 className="font-medium">{replyTo ? (fa ? `پاسخ به ${replyTo.name}` : `Reply to ${replyTo.name}`) : (fa ? "ثبت دیدگاه" : "Leave a comment")}</h3>
      {prompt && !replyTo && <p className="text-sm text-ink-soft">{prompt}</p>}
      {replyTo && <button type="button" className="text-sm text-accent" onClick={() => setReplyTo(null)}>{fa ? "لغو پاسخ" : "Cancel reply"}</button>}
      <div className="grid gap-3 sm:grid-cols-2"><input value={name} onChange={(event) => setName(event.target.value)} aria-label={fa ? "نام" : "Name"} placeholder={fa ? "نام" : "Name"} className="rounded border border-line px-3 py-2" required /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label={fa ? "ایمیل" : "Email"} placeholder={fa ? "ایمیل (نمایش داده نمی‌شود)" : "Email (not published)"} className="rounded border border-line px-3 py-2" required /></div>
      <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <textarea id="comment-body" value={body} onChange={(event) => setBody(event.target.value)} aria-label={fa ? "دیدگاه شما" : "Your comment"} placeholder={fa ? "دیدگاه شما" : "Your comment"} rows={4} className="w-full rounded border border-line px-3 py-2" required />
      <button className="rounded bg-accent px-5 py-2 text-paper">{fa ? "ارسال برای بررسی" : "Submit for review"}</button><p className="text-sm text-ink-muted" role="status">{status}</p>
    </form>
  </section>;
}
