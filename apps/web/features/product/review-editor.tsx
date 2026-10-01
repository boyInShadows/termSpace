"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type OwnReview = { id: string; rating: number; body: string; status: "PUBLISHED" | "HELD" | "WITHDRAWN"; version: number };
type ReviewState = { eligible: boolean; reason: string | null; review: OwnReview | null };

export function ReviewEditor({ slug }: { slug: string }) {
  const { fa, locale } = useLocale();
  const session = useMarketplaceSession();
  const router = useRouter();
  const [state, setState] = useState<ReviewState | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const path = `/api/marketplace/products/${encodeURIComponent(slug)}/review`;

  useEffect(() => {
    if (!session.email) return;
    const controller = new AbortController();
    void request<{ data: ReviewState }>(path, { signal: controller.signal }).then(({ data }) => {
      setState(data); setRating(data.review?.rating ?? 5); setBody(data.review?.body ?? "");
    }).catch((error) => { if (!controller.signal.aborted) setMessage((error as Error).message); });
    return () => controller.abort();
  }, [path, session.email]);

  if (session.loading) return null;
  if (!session.email) return <p className="mt-5"><Link className="text-primary underline" href={`${localePath("/account", locale)}?next=${encodeURIComponent(localePath(`/products/${slug}`, locale))}`}>{fa ? "برای نوشتن نظر وارد شوید" : "Sign in to write a review"}</Link></p>;
  const reason = state?.reason === "EMAIL_VERIFICATION_REQUIRED" ? fa ? "ابتدا ایمیل خود را تأیید کنید." : "Verify your email first."
    : state?.reason === "CREATOR_CONFLICT" ? fa ? "سازنده نمی‌تواند برای مورد خود نظر بنویسد." : "Creators cannot review their own listing."
    : fa ? "پس از افزودن این مورد به کتابخانه می‌توانید نظر بنویسید." : "Add this listing to your library before reviewing it.";
  return <div className="mt-6 rounded-lg border bg-surface p-5">
    <h3 className="font-semibold">{fa ? "نظر شما" : "Your review"}</h3>
    {state && !state.eligible ? <p className="mt-2 text-sm">{reason}</p> : state?.eligible && <form className="mt-4 space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const result = await request<{ data: OwnReview }>(path, { method: "PUT", body: JSON.stringify({ rating, body, ...(state.review ? { expectedVersion: state.review.version } : {}) }) });
        setState({ ...state, review: result.data });
        setMessage(result.data.status === "HELD" ? fa ? "نظر شما در انتظار بررسی است." : "Your review is awaiting moderation." : fa ? "نظر شما منتشر شد." : "Your review is published.");
        router.refresh();
      } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
    }}>
      <fieldset><legend className="text-sm font-medium">{fa ? "امتیاز" : "Rating"}</legend><div className="mt-2 flex flex-wrap gap-3">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="flex items-center gap-1"><input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} />{value}</label>)}</div></fieldset>
      <label className="block text-sm font-medium">{fa ? "تجربه شما" : "Your experience"}<textarea required minLength={20} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} className="mt-2 block min-h-28 w-full rounded border bg-background p-3" /></label>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}>{state.review?.status !== "WITHDRAWN" ? fa ? "ویرایش نظر" : "Save review" : fa ? "ثبت دوباره" : "Post review"}</Button>{state.review && state.review.status !== "WITHDRAWN" && <Button type="button" variant="outline" disabled={busy} onClick={async () => {
        setBusy(true); setMessage(""); try { await request(path, { method: "DELETE" }); setState({ ...state, review: { ...state.review!, status: "WITHDRAWN", version: state.review!.version + 1 } }); setMessage(fa ? "نظر پس گرفته شد." : "Review withdrawn."); router.refresh(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
      }}>{fa ? "پس گرفتن نظر" : "Withdraw review"}</Button>}</div>
      {state.review?.status === "HELD" && <p className="text-sm">{fa ? "در انتظار بررسی" : "Awaiting moderation"}</p>}
    </form>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </div>;
}
