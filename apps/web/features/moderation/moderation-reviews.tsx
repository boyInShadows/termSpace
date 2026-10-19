"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rating } from "@/components/marketplace/product-parts";
import { ApiError, listReviewsForModeration, setReviewVisibility } from "@/lib/api";
import { intlLocale } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";
import type { OwnReview } from "@/lib/types";

const text = {
  en: {
    title: "Reviews", none: "No reviews on this listing.", hide: "Hide", restore: "Restore", hiding: "Hiding…", restoring: "Restoring…",
    reason: "Reason shown to the author", hiddenBy: "Hidden", edited: "edited", loadFailed: "Couldn't load the reviews.",
  },
  fa: {
    title: "نقدها", none: "این فهرست نقدی ندارد.", hide: "پنهان کردن", restore: "بازگرداندن", hiding: "در حال پنهان کردن…", restoring: "در حال بازگرداندن…",
    reason: "دلیل (برای نویسنده نمایش داده می‌شود)", hiddenBy: "پنهان‌شده", edited: "ویرایش‌شده", loadFailed: "بارگذاری نقدها ممکن نشد.",
  },
};

function ReviewRow({ review, onChange }: { review: OwnReview; onChange: (id: string, hidden: OwnReview["hidden"]) => void }) {
  const { locale } = useLocale();
  const t = text[locale];
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });

  async function run(action: "hide" | "restore") {
    setBusy(true); setError(null);
    try {
      const result = await setReviewVisibility(review.id, { action, reason: action === "hide" ? reason.trim() : undefined });
      onChange(review.id, result.hidden);
      setReason("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t.loadFailed);
    } finally { setBusy(false); }
  }

  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong>{review.author}</strong>
          <Rating rating={review.rating} />
          <span className="text-xs text-muted-foreground">{date.format(new Date(review.createdAt))}{review.updatedAt !== review.createdAt && ` · ${t.edited}`}</span>
        </div>
        {review.hidden && <span className="rounded-none bg-muted px-2 py-0.5 text-xs">{t.hiddenBy}</span>}
      </div>
      <p className="ts-bidi mt-2 text-sm">{review.body}</p>
      {review.hidden?.reason && <p className="mt-2 text-xs text-muted-foreground">{review.hidden.reason}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {review.hidden ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("restore")}>{busy ? t.restoring : t.restore}</Button>
        ) : (
          <>
            <label className="min-w-0 flex-1 text-xs font-semibold">{t.reason}
              <Input className="mt-1" value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} />
            </label>
            <Button size="sm" variant="destructive" disabled={busy || reason.trim().length < 5} onClick={() => void run("hide")}>{busy ? t.hiding : t.hide}</Button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </li>
  );
}

/** Every review of a listing, hidden ones included, with hide and restore for staff. */
export function ModerationReviews({ productId }: { productId: string }) {
  const { locale } = useLocale();
  const t = text[locale];
  const [reviews, setReviews] = useState<OwnReview[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listReviewsForModeration(productId)
      .then((list) => { if (!controller.signal.aborted) setReviews(list); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [productId]);

  const update = useCallback((id: string, hidden: OwnReview["hidden"]) => {
    setReviews((current) => current && current.map((review) => (review.id === id ? { ...review, hidden } : review)));
  }, []);

  return (
    <section className="rounded-2xl border bg-surface p-5 sm:p-6" aria-labelledby="moderation-reviews-title">
      <h2 id="moderation-reviews-title" className="editorial text-2xl">{t.title}</h2>
      <div className="mt-4">
        {failed ? <p role="alert" className="text-sm text-destructive">{t.loadFailed}</p>
          : reviews === null ? null
            : reviews.length === 0 ? <p className="text-sm text-muted-foreground">{t.none}</p>
              : <ul className="space-y-3">{reviews.map((review) => <ReviewRow key={review.id} review={review} onChange={update} />)}</ul>}
      </div>
    </section>
  );
}
