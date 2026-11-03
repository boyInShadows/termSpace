"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "next-intl";

export function Newsletter() {
  const fa = useLocale() === "fa";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setError(fa ? "یک ایمیل معتبر وارد کنید." : "Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setStatus("idle");
    setError("");

    try {
      await api.subscribeToNewsletter(trimmed);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-2xl border border-line bg-paper-warm p-10 md:p-14">
        <p className="text-sm font-medium text-ink-muted">Termspace Letter</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
          {fa ? "ایده‌هایی برای نگه‌داشتن، ماهی یک‌بار." : "Ideas worth keeping, once a month."}
        </h2>
        <p className="mt-3 text-ink-soft max-w-prose">
          {fa ? "گزیده‌ای کوتاه و سنجیده از بهترین نوشته‌ها دربارهٔ مهارت، کد و آرامش؛ بدون هیاهو و هرزنامه." : "A short, thoughtful digest of the best writing on craft, code, and calm. No noise, no spam — just one letter you will actually want to read."}
        </p>

        {status === "success" ? (
          <p className="mt-6 rounded-lg bg-accent-tint p-4 text-accent font-medium" role="status">
            {fa ? "سپاس؛ نام شما در فهرست ثبت شد." : "Thank you — you are on the list. See you in your inbox."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              {fa ? "نشانی ایمیل" : "Email address"}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? "newsletter-error" : undefined}
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-action px-6 py-3 font-medium text-action-foreground transition-colors hover:bg-action-hover"
            >
              {submitting ? (fa ? "در حال ثبت…" : "Subscribing...") : (fa ? "عضویت" : "Subscribe")}
            </button>
          </form>
        )}

        {status === "error" && (
          <p id="newsletter-error" className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
