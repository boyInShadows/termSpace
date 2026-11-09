"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { SupportAttachment } from "@/lib/support-api";
import { supportCopy } from "./support-copy";

export function PrivateScreenshot({ attachment, number, admin, locale }: {
  attachment: SupportAttachment; number: number; admin: boolean; locale: Locale;
}) {
  const c = supportCopy[locale];
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const path = `/backend/api/support${admin ? "/admin" : ""}/attachments/${encodeURIComponent(attachment.id)}`;
  return <div className="space-y-2">
    {failed ? <div className="space-y-2 rounded-control border border-border p-3">
      <p role="alert" className="text-sm text-destructive">{c.imageUnavailable}</p>
      <Button type="button" variant="secondary" onClick={() => { setAttempt(value => value + 1); setFailed(false); }}>{c.retry}</Button>
    </div> : <Image unoptimized src={`${path}?attempt=${attempt}`} alt={`${c.screenshot} ${number}`}
      width={attachment.width} height={attachment.height} onError={() => setFailed(true)}
      className="max-h-80 w-auto max-w-full rounded-control border border-border object-contain" />}
    <a href={path} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline">{c.openScreenshot} {number}</a>
  </div>;
}
