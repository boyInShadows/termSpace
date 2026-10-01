"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Notice = { id: string; kind: string; product: { slug: string; name: string }; text: string; createdAt: string; read: boolean };

export function MarketplaceNotifications() {
  const { fa, locale } = useLocale();
  const session = useMarketplaceSession();
  const creator = session.marketplaceRoles.includes("creator");
  const [scope, setScope] = useState<"member" | "creator">("member");
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const path = scope === "creator" ? "/api/marketplace/creator/notifications" : "/api/marketplace/notifications";
  useEffect(() => {
    const controller = new AbortController();
    void request<{ data: Notice[] }>(path, { signal: controller.signal }).then(({ data }) => { setNotices(data); setError(""); }).catch((cause) => { if (!controller.signal.aborted) setError((cause as Error).message); });
    return () => controller.abort();
  }, [path]);
  return <section>
    <h1 className="editorial text-4xl">{fa ? "اعلان‌ها" : "Notifications"}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{fa ? "به‌روزرسانی‌های موارد دنبال‌شده و فعالیت‌های سازنده" : "Updates to saved and acquired listings, and creator activity"}</p>
    {creator && <div className="mt-5 flex gap-2"><Button type="button" variant={scope === "member" ? "primary" : "outline"} onClick={() => { setScope("member"); setNotices(null); }}>{fa ? "برای من" : "For me"}</Button><Button type="button" variant={scope === "creator" ? "primary" : "outline"} onClick={() => { setScope("creator"); setNotices(null); }}>{fa ? "سازنده" : "Creator"}</Button></div>}
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {!notices && !error && <p role="status" className="mt-5">{fa ? "در حال بارگذاری…" : "Loading…"}</p>}
    {notices && <><div className="mt-5 flex justify-end"><Button type="button" variant="outline" disabled={busy || !notices.some((notice) => !notice.read)} onClick={async () => {
      setBusy(true); setError(""); try { await request(`${path}/read`, { method: "POST" }); setNotices(notices.map((notice) => ({ ...notice, read: true }))); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
    }}>{fa ? "همه خوانده شد" : "Mark all read"}</Button></div>
      {!notices.length && <p className="mt-5">{fa ? "اعلانی نیست." : "No notifications yet."}</p>}
      <ol className="mt-4 space-y-3">{notices.map((notice) => <li key={`${notice.kind}:${notice.id}`} className={`rounded-lg border p-4 ${notice.read ? "bg-surface" : "border-primary/40 bg-primary/5"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase">{notice.kind.replaceAll("_", " ")}</span><time className="text-xs text-muted-foreground" dateTime={notice.createdAt}>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(notice.createdAt))}</time></div><Link className="mt-2 block font-semibold text-primary underline" href={localePath(`/products/${notice.product.slug}`, locale)}>{notice.product.name}</Link><p className="mt-1 text-sm">{notice.text}</p></li>)}</ol>
    </>}
  </section>;
}
