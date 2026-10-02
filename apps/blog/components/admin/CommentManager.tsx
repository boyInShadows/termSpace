"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

type AdminComment = Comment & { email: string; approved: boolean; parent: { name: string; body: string; approved: boolean } | null; article: { title: string; slug: string } };

export function CommentManager({ initialComments }: { initialComments: AdminComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState("");

  async function update(id: string, action: () => Promise<void>, change: (comment: AdminComment) => AdminComment) {
    setError("");
    try {
      await action();
      setComments((items) => items.map((item) => item.id === id ? change(item) : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update comment"); }
  }

  return <div className="space-y-4">
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {comments.map((comment) => <article key={comment.id} className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex flex-wrap justify-between gap-2"><div><strong>{comment.name}</strong> <span className="text-sm text-ink-muted">{comment.email}</span><p className="text-xs text-ink-muted">On <Link href={`/blog/${comment.article.slug}`} className="text-accent">{comment.article.title}</Link></p></div><span className={`text-xs ${comment.approved ? "text-green-700" : "text-amber-700"}`}>{comment.approved ? "Approved" : "Pending"}</span></div>
      {comment.parent && <blockquote className="mt-3 border-s-2 border-line ps-3 text-sm text-ink-muted">Reply to {comment.parent.name}: {comment.parent.body.slice(0, 180)}{!comment.parent.approved && " (parent pending)"}</blockquote>}
      <p className="mt-3 whitespace-pre-wrap">{comment.body}</p>
      <div className="mt-4 flex gap-3">
        {!comment.approved && <button className="text-sm text-accent" onClick={() => void update(comment.id, () => api.approveComment(comment.id), (item) => ({ ...item, approved: true }))}>Approve</button>}
        {comment.approved && <button className="text-sm text-accent" onClick={() => void update(comment.id, () => api.curateComment(comment.id, !comment.curated), (item) => ({ ...item, curated: !item.curated }))}>{comment.curated ? "Remove from perspectives" : "Feature as perspective"}</button>}
        <button className="text-sm text-red-700" onClick={async () => { setError(""); try { await api.deleteComment(comment.id); setComments((items) => items.filter((item) => item.id !== comment.id).map((item) => item.parentId === comment.id ? { ...item, parentId: null, parent: null } : item)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete comment"); } }}>Delete</button>
      </div>
    </article>)}
  </div>;
}
