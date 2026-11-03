"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

export function Comments({ slug, initialComments, locale = "en" }: { slug: string; initialComments: Comment[]; locale?: "en" | "fa" }) {
  const fa = locale === "fa";
  const [comments] = useState(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    setStatus(fa ? "در حال ارسال…" : "Submitting…");
    try {
      const response = await api.submitComment(slug, { name, email, body, website });
      setStatus(response.data.message);
      setBody("");
    } catch (error) {
      setFailed(true);
      setStatus(error instanceof Error ? error.message : (fa ? "ارسال دیدگاه انجام نشد. دوباره تلاش کنید." : "Unable to submit comment. Try again."));
    } finally { pending.current = false; setBusy(false); }
  }

  return <section className="mx-auto max-w-3xl py-14"><h2 className="font-serif text-2xl font-semibold">{fa ? "گفت‌وگو" : "Discussion"}</h2><div className="mt-6 space-y-5">{comments.map((comment) => <article key={comment.id} className="rounded-lg border border-line p-4"><div className="flex justify-between text-sm"><strong>{comment.name}</strong><time className="text-ink-muted">{new Date(comment.createdAt).toLocaleDateString(fa ? "fa-IR" : "en")}</time></div><p className="mt-2 whitespace-pre-wrap text-ink-soft">{comment.body}</p></article>)}{comments.length === 0 && <p className="text-sm text-ink-muted">{fa ? "هنوز دیدگاه تأییدشده‌ای وجود ندارد." : "No approved comments yet."}</p>}</div><form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-line bg-paper-card p-5"><h3 className="font-medium">{fa ? "ثبت دیدگاه" : "Leave a comment"}</h3><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">{fa ? "\u0646\u0627\u0645" : "Name"}<input disabled={busy} value={name} onChange={(event) => setName(event.target.value)} placeholder={fa ? "نام" : "Name"} className="rounded border border-line-input px-3 py-2" required /></label><label className="grid gap-2 text-sm font-medium">{fa ? "\u0627\u06cc\u0645\u06cc\u0644" : "Email (not published)"}<input disabled={busy} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={fa ? "ایمیل (نمایش داده نمی‌شود)" : "Email (not published)"} className="rounded border border-line-input px-3 py-2" required /></label></div><input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" /><label className="grid gap-2 text-sm font-medium">{fa ? "\u062f\u06cc\u062f\u06af\u0627\u0647 \u0634\u0645\u0627" : "Your comment"}<textarea disabled={busy} value={body} onChange={(event) => setBody(event.target.value)} placeholder={fa ? "دیدگاه شما" : "Your comment"} rows={4} className="w-full rounded border border-line-input px-3 py-2" required /></label><button disabled={busy} className="rounded bg-action px-5 py-2 text-action-foreground hover:bg-action-hover">{fa ? "ارسال برای بررسی" : "Submit for review"}</button>{status && <p role={failed ? "alert" : "status"} className="text-sm text-ink-muted">{status}</p>}</form></section>;
}
