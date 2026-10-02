"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function UnsubscribeForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <form onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { await api.unsubscribeFromNewsletter(token); setMessage("You are unsubscribed from the editorial newsletter."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to unsubscribe"); } finally { setBusy(false); } }} className="mt-8 space-y-4"><button disabled={busy || !token} className="rounded bg-accent px-5 py-3 text-paper disabled:opacity-50">Confirm unsubscribe</button><p role="status" className="text-sm text-ink-soft">{message}</p></form>;
}
