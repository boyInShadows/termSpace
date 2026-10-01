"use client";
import Link from "next/link";
import { useState } from "react";
import { request } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function ReportResource({ product }: { product: ProductDetail }) {
  const { fa, locale } = useLocale();
  const session = useMarketplaceSession();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const targets = [
    { type: "PRODUCT", id: product.id, label: fa ? "این مورد" : "Listing" },
    {
      type: "CREATOR",
      id: product.creator.id,
      label: fa ? "پروفایل سازنده" : "Creator profile",
    },
    ...(product.currentReleaseId
      ? [
          {
            type: "RELEASE",
            id: product.currentReleaseId,
            label: fa ? "نسخه فعلی" : "Current release",
          },
        ]
      : []),
    ...(product.communities ?? []).map((community) => ({
      type: "PLACEMENT",
      id: community.id,
      label: `${fa ? "جایگاه جامعه" : "Community placement"}: ${community.nameEn}`,
    })),
    ...product.reviews.map((review) => ({
      type: "REVIEW",
      id: review.id,
      label: `${fa ? "نظر" : "Review"}: ${review.author}`,
    })),
  ];
  return (
    <details className="mt-6 rounded-lg border p-4">
      <summary className="cursor-pointer font-medium">
        {fa ? "گزارش مشکل" : "Report a concern"}
      </summary>
      {!session.email ? (
        <Link
          className="mt-3 block text-primary"
          href={`${localePath("/account", locale)}?next=${encodeURIComponent(localePath(`/products/${product.slug}`, locale))}`}
        >
          {fa ? "برای گزارش وارد شوید" : "Sign in to report"}
        </Link>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const target = targets[Number(fields.get("target"))];
            setBusy(true);
            setError("");
            try {
              await request("/api/marketplace/reports", {
                method: "POST",
                body: JSON.stringify({
                  targetType: target.type,
                  targetId: target.id,
                  reason: fields.get("reason"),
                  explanation: fields.get("explanation"),
                }),
              });
              setMessage(
                fa
                  ? "گزارش برای بررسی ثبت شد."
                  : "Your report was submitted for review.",
              );
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            {fa ? "موضوع گزارش" : "Report target"}
            <select
              name="target"
              className="mt-2 w-full rounded border bg-surface p-2"
            >
              {targets.map((target, index) => (
                <option key={`${target.type}:${target.id}`} value={index}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            {fa ? "دلیل" : "Reason"}
            <select
              name="reason"
              className="mt-2 w-full rounded border bg-surface p-2"
            >
              {[
                ["MALICIOUS", "Malicious behavior", "رفتار مخرب"],
                ["SOURCE_COMPROMISE", "Source compromise", "منبع آلوده"],
                [
                  "IMPERSONATION",
                  "Ownership or impersonation",
                  "جعل هویت یا مالکیت",
                ],
                ["MISLEADING", "Misleading claims", "ادعاهای گمراه‌کننده"],
                ["BROKEN", "Broken or abandoned", "خراب یا رهاشده"],
                ["ABUSE", "Spam or abuse", "هرزنامه یا سوءاستفاده"],
                ["OTHER", "Other policy concern", "سایر نگرانی‌ها"],
              ].map(([value, en, persian]) => (
                <option key={value} value={value}>
                  {fa ? persian : en}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            {fa ? "توضیح و شواهد" : "Explanation and evidence"}
            <textarea
              name="explanation"
              required
              minLength={10}
              maxLength={4000}
              className="mt-2 w-full rounded border bg-surface p-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <Button disabled={busy || Boolean(message)}>
            {fa ? "ارسال گزارش" : "Submit report"}
          </Button>
        </form>
      )}
    </details>
  );
}
