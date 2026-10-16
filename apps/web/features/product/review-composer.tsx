"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { ApiError, deleteReview, getMyReview, saveReview } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import type { MyReviewState } from "@/lib/types";
import { cn } from "@/lib/utils";

const text = {
  en: {
    title: "Your review", signIn: "Sign in to review this listing.", signInLink: "Sign in",
    notAcquired: "Add this listing to your library to review it.", ownListing: "You can't review your own listing.",
    verify: "Verify your email to write a review.", loading: "Checking whether you can review this listing…",
    rating: "Your rating", needRating: "Choose a rating from 1 to 5.", stars: (n: number) => `${n} out of 5`, name: "Name shown with your review", nameHint: "This is not your email address.",
    body: "Your review", bodyHint: (n: number) => `${n} / 2000`, post: "Post review", update: "Update review", saving: "Saving…",
    remove: "Delete review", confirmRemove: "Delete your review?", saved: "Review saved.", removed: "Review deleted.",
    hidden: "A moderator hid your review, so it can't be edited or deleted.", reason: "Reason",
    tooMany: "Too many review changes. Try again later.", loadFailed: "Couldn't check your review status.",
  },
  fa: {
    title: "نقد شما", signIn: "برای نقد این فهرست وارد شوید.", signInLink: "ورود",
    notAcquired: "برای نقد این فهرست، آن را به کتابخانهٔ خود اضافه کنید.", ownListing: "نمی‌توانید فهرست خودتان را نقد کنید.",
    verify: "برای نوشتن نقد، ایمیل خود را تأیید کنید.", loading: "در حال بررسی امکان نقد این فهرست…",
    rating: "امتیاز شما", needRating: "امتیازی از ۱ تا ۵ انتخاب کنید.", stars: (n: number) => `${n} از ۵`, name: "نامی که کنار نقد نمایش داده می‌شود", nameHint: "این نشانی ایمیل شما نیست.",
    body: "نقد شما", bodyHint: (n: number) => `${n} / ۲۰۰۰`, post: "ثبت نقد", update: "به‌روزرسانی نقد", saving: "در حال ذخیره…",
    remove: "حذف نقد", confirmRemove: "نقد شما حذف شود؟", saved: "نقد ذخیره شد.", removed: "نقد حذف شد.",
    hidden: "یک ناظر نقد شما را پنهان کرده است و قابل ویرایش یا حذف نیست.", reason: "دلیل",
    tooMany: "تعداد تغییرات نقد زیاد بود. بعداً دوباره تلاش کنید.", loadFailed: "بررسی وضعیت نقد شما ممکن نشد.",
  },
};

/** The reader's way in: sign in, add to library, verify email, then write, edit or delete one review. */
export function ReviewComposer({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const t = text[locale];
  const router = useRouter();
  const session = useMarketplaceSession();
  const fieldId = useId();
  const [state, setState] = useState<MyReviewState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session.loading || !session.email) return;
    const controller = new AbortController();
    getMyReview(slug, controller.signal)
      .then((next) => {
        setState(next);
        setRating(next.review?.rating ?? 0);
        setDisplayName(next.review?.author ?? "");
        setBody(next.review?.body ?? "");
      })
      .catch((cause) => { if (!controller.signal.aborted) { setLoadError(true); console.error("Review status failed", cause); } });
    return () => controller.abort();
  }, [slug, session.loading, session.email]);

  function explain(cause: unknown): string {
    if (cause instanceof ApiError) {
      if (cause.code === "REVIEW_HIDDEN") return t.hidden;
      if (cause.code === "ACQUISITION_REQUIRED") return t.notAcquired;
      if (cause.code === "OWN_LISTING") return t.ownListing;
      if (cause.code === "EMAIL_VERIFICATION_REQUIRED") return t.verify;
      if (cause.status === 429) return t.tooMany;
      return cause.message;
    }
    return t.loadFailed;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) { setMessage({ kind: "error", text: t.needRating }); return; }
    setBusy(true); setMessage(null);
    try {
      const review = await saveReview(slug, { rating, displayName: displayName.trim(), body: body.trim() });
      setState((current) => current && { ...current, review });
      setMessage({ kind: "ok", text: t.saved });
      router.refresh();
    } catch (cause) {
      setMessage({ kind: "error", text: explain(cause) });
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm(t.confirmRemove)) return;
    setBusy(true); setMessage(null);
    try {
      await deleteReview(slug);
      setState((current) => current && { ...current, review: null });
      setRating(0); setDisplayName(""); setBody("");
      setMessage({ kind: "ok", text: t.removed });
      router.refresh();
    } catch (cause) {
      setMessage({ kind: "error", text: explain(cause) });
    } finally { setBusy(false); }
  }

  const account = `${localePath("/account", locale)}?next=${encodeURIComponent(localePath(`/products/${slug}`, locale))}`;
  let content: React.ReactNode;
  if (session.loading) content = <p className="text-sm">{t.loading}</p>;
  else if (!session.email) content = <p className="text-sm">{t.signIn} <Link className="font-semibold text-primary hover:underline" href={account}>{t.signInLink}</Link></p>;
  else if (loadError) content = <p role="alert" className="text-sm text-destructive">{t.loadFailed}</p>;
  else if (!state) content = <p className="text-sm">{t.loading}</p>;
  else if (state.eligibility === "own_listing") content = <p className="text-sm">{t.ownListing}</p>;
  else if (state.eligibility === "not_acquired") content = <p className="text-sm">{t.notAcquired}</p>;
  else if (!session.emailVerified) content = <p className="text-sm">{t.verify} <Link className="font-semibold text-primary hover:underline" href={localePath("/account", locale)}>{t.signInLink}</Link></p>;
  else if (state.review?.hidden) {
    content = (
      <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
        <p>{t.hidden}</p>
        {state.review.hidden.reason && <p className="mt-1"><strong>{t.reason}:</strong> {state.review.hidden.reason}</p>}
      </div>
    );
  } else {
    content = (
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-foreground">{t.rating}</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name={`${fieldId}-rating`} value={value} checked={rating === value} onChange={() => setRating(value)} className="peer sr-only" aria-label={t.stars(value)} />
                <Star size={26} className={cn("rounded-sm text-muted-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring", value <= rating && "fill-primary text-primary")} aria-hidden="true" />
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`${fieldId}-name`} className="text-sm font-semibold text-foreground">{t.name}</label>
          <Input id={`${fieldId}-name`} className="mt-2 max-w-sm" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={40} required aria-describedby={`${fieldId}-name-hint`} />
          <p id={`${fieldId}-name-hint`} className="mt-1 text-xs">{t.nameHint}</p>
        </div>
        <div>
          <label htmlFor={`${fieldId}-body`} className="text-sm font-semibold text-foreground">{t.body}</label>
          <textarea id={`${fieldId}-body`} className="mt-2 min-h-32 w-full max-w-2xl rounded-md border border-input bg-surface p-3 text-sm hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={2000} required />
          <p className="mt-1 text-xs" dir="ltr">{t.bodyHint(body.length)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>{busy ? t.saving : state.review ? t.update : t.post}</Button>
          {state.review && <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>{t.remove}</Button>}
        </div>
      </form>
    );
  }

  return (
    <div className="mb-8 rounded-xl border bg-surface p-5">
      <h3 className="mb-3 font-semibold text-foreground">{t.title}</h3>
      {content}
      <p role={message?.kind === "error" ? "alert" : "status"} className={cn("mt-3 min-h-5 text-sm", message?.kind === "error" ? "text-destructive" : "text-muted-foreground")}>{message?.text ?? ""}</p>
    </div>
  );
}
