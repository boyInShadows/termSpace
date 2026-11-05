"use client";

import { useState } from "react";
import { useAdminAction } from "./use-admin-action";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

type AdminComment = Comment & { email: string; approved: boolean; article: { title: string; slug: string } };
export function CommentManager({ initialComments }: { initialComments: AdminComment[] }) {
  const { busy, feedback, run } = useAdminAction();
  const [comments, setComments] = useState(initialComments);
  return <div className="space-y-4">{feedback && <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}{comments.map((comment) => <article key={comment.id} className="rounded-lg border border-line bg-paper-card p-5"><div className="flex flex-wrap justify-between gap-2"><div><strong>{comment.name}</strong> <span className="text-sm text-ink-muted">{comment.email}</span><p className="text-xs text-ink-muted">On <Link href={`/blog/${comment.article.slug}`} className="text-accent">{comment.article.title}</Link></p></div><span className={`text-xs ${comment.approved ? "text-green-700" : "text-amber-700"}`}>{comment.approved ? "Approved" : "Pending"}</span></div><p className="mt-3 whitespace-pre-wrap">{comment.body}</p><div className="mt-4 flex gap-3">{!comment.approved && <button disabled={busy} className="text-sm text-accent" onClick={() => void run(async () => { await api.approveComment(comment.id); setComments((items) => items.map((item) => item.id === comment.id ? { ...item, approved: true } : item)); }, "Comment approved")}>Approve</button>}<button disabled={busy} className="text-sm text-red-700" onClick={() => void run(async () => { await api.deleteComment(comment.id); setComments((items) => items.filter((item) => item.id !== comment.id)); }, "Comment deleted")}>Delete</button></div></article>)}</div>;
}
