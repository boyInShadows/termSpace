"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { request } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Review = { id: string; author: string; rating: number; body: string; version?: number; product: { name: string; slug: string }; response?: { id: string; body: string } | null };
type ReviewPage = { data: Review[]; meta: { page: number; totalPages: number; total: number } };

export function ReviewManager({ staff = false }: { staff?: boolean }) {
  const { fa, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ReviewPage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const base = `/api/marketplace/${staff ? "moderation" : "creator"}/reviews`;
  const load = useCallback(async () => {
    try { setResult(await request<ReviewPage>(`${base}?page=${page}&limit=20`)); setError(""); }
    catch (cause) { setError((cause as Error).message); }
  }, [base, page]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  return <section className="space-y-5">
    <h1 className="editorial text-3xl">{staff ? fa ? "بررسی نظرها" : "Review moderation" : fa ? "نظرهای دریافت‌شده" : "Received reviews"}</h1>
    <p className="text-sm text-muted-foreground">{staff ? fa ? "نظرهای نگه‌داشته‌شده را بررسی کنید." : "Decide held reviews." : fa ? "به نظرهای منتشرشده پاسخ دهید." : "Respond to published reviews."}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {result?.data.length === 0 && <p>{fa ? "نظری موجود نیست." : "No reviews here."}</p>}
    {result?.data.map((review) => <article key={review.id} className="space-y-3 rounded-lg border bg-surface p-5">
      <Link className="font-semibold text-primary underline" href={localePath(`/products/${review.product.slug}#reviews`, locale)}>{review.product.name}</Link>
      <p className="text-sm">{review.author} · {review.rating}/5</p>
      <p className="whitespace-pre-wrap">{review.body}</p>
      {staff ? <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
        try { await request(`${base}/${review.id}`, { method: "POST", body: JSON.stringify({ action: form.get("action"), expectedVersion: review.version, publicReason: form.get("publicReason") }) }); await load(); }
        catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
      }}>
        <label className="block text-sm">{fa ? "تصمیم" : "Decision"}<select name="action" className="mt-1 block rounded border bg-background p-2"><option value="APPROVE">{fa ? "تأیید" : "Approve"}</option><option value="HOLD">{fa ? "نگه داشتن" : "Hold"}</option><option value="REMOVE">{fa ? "حذف" : "Remove"}</option></select></label>
        <label className="block text-sm">{fa ? "دلیل قابل نمایش" : "Public reason"}<textarea name="publicReason" required minLength={10} maxLength={1000} className="mt-1 block min-h-20 w-full rounded border bg-background p-2" /></label>
        <Button type="submit" disabled={busy}>{fa ? "ثبت تصمیم" : "Save decision"}</Button>
      </form> : <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
        try { await request(`${base}/${review.id}/response`, { method: "PUT", body: JSON.stringify({ body: form.get("body") }) }); await load(); }
        catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
      }}>
        <label className="block text-sm">{fa ? "پاسخ سازنده" : "Creator response"}<textarea key={review.response?.body ?? ""} name="body" defaultValue={review.response?.body ?? ""} required minLength={10} maxLength={2000} className="mt-1 block min-h-20 w-full rounded border bg-background p-2" /></label>
        <Button type="submit" disabled={busy}>{fa ? "ذخیره پاسخ" : "Save response"}</Button>
        {review.response && <Button type="button" variant="outline" disabled={busy} onClick={async () => {
          setBusy(true); setError(""); try { await request(`${base}/${review.id}/response`, { method: "DELETE" }); await load(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
        }}>{fa ? "حذف پاسخ" : "Withdraw response"}</Button>}
      </form>}
    </article>)}
    {result && result.meta.totalPages > 1 && <nav aria-label={fa ? "صفحه‌های نظرها" : "Review pages"} className="flex items-center gap-3"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{fa ? "قبلی" : "Previous"}</Button><span>{page}/{result.meta.totalPages}</span><Button type="button" variant="outline" disabled={page >= result.meta.totalPages} onClick={() => setPage(page + 1)}>{fa ? "بعدی" : "Next"}</Button></nav>}
  </section>;
}
