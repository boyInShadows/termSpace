"use client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { supportCopy } from "@/features/support/support-copy";
export default function SupportError({ reset }: { reset: () => void }) {
  const c = supportCopy[useLocale().locale];
  return <div className="space-y-4 py-8"><p role="alert">{c.error}</p><Button onClick={reset}>{c.retry}</Button></div>;
}
