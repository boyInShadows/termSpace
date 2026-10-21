"use client";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rating } from "@/components/marketplace/product-parts";
import { ApiError, listReviewsForModeration, setReviewVisibility } from "@/lib/api";
import { intlLocale } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";
import type { OwnReview } from "@/lib/types";
import { useModerationCopy } from "./copy";
import { Panel } from "./moderation-ui";

function ReviewRow({ review, onChange }: { review: OwnReview; onChange: (id: string, hidden: OwnReview["hidden"]) => void }) {
  const { locale } = useLocale();
  const m = useModerationCopy();
  const hintId = useId();
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
      setError(cause instanceof ApiError ? cause.message : m.reviewActionFailed);
    } finally { setBusy(false); }
  }

  return (
    <li className="p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong><bdi>{review.author}</bdi></strong>
          <Rating rating={review.rating} locale={locale} />
          <span className="text-xs text-muted-foreground">{date.format(new Date(review.createdAt))}{review.updatedAt !== review.createdAt && ` · ${m.reviewEdited}`}</span>
        </div>
        {review.hidden && <span className="border border-border px-2 py-0.5 text-xs font-semibold">{m.reviewHiddenOn.replace("{date}", date.format(new Date(review.hidden.at)))}</span>}
      </div>
      <p className="ts-bidi mt-2 text-sm">{review.body}</p>
      {review.hidden?.reason && <p className="mt-2 text-xs text-muted-foreground">{review.hidden.reason}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {review.hidden ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("restore")}>{busy ? m.reviewRestoring : m.reviewRestore}</Button>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-semibold" htmlFor={`${hintId}-input`}>{m.reviewReason}</label>
              <Input id={`${hintId}-input`} className="mt-1" value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} aria-describedby={hintId} />
              <p id={hintId} className="mt-1 text-xs text-muted-foreground">{m.reviewReasonHint}</p>
            </div>
            <Button size="sm" variant="destructive" disabled={busy || reason.trim().length < 5} onClick={() => void run("hide")}>{busy ? m.reviewHiding : m.reviewHide}</Button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </li>
  );
}

/** Every review of a listing, hidden ones included, with hide and restore for staff. */
export function ModerationReviews({ productId }: { productId: string }) {
  const m = useModerationCopy();
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
    <Panel id="moderation-reviews-title" title={m.reviewsTitle}>
      {failed ? <p role="alert" className="text-sm text-destructive">{m.reviewsFailed}</p>
        : reviews === null ? <p role="status" className="text-sm text-muted-foreground">{m.reviewsLoading}</p>
          : reviews.length === 0 ? <p className="text-sm text-muted-foreground">{m.reviewsNone}</p>
            : <ul className="divide-y divide-border border border-border">{reviews.map((review) => <ReviewRow key={review.id} review={review} onChange={update} />)}</ul>}
    </Panel>
  );
}
