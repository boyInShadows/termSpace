"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, getMarketplaceLibrary, login, logout, register } from "@/lib/api";
import type { MarketplaceLibraryEntry } from "@/lib/types";
import { useMarketplaceSession } from "./marketplace-session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

export function AccountForm() {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter(); const params = useSearchParams(); const session = useMarketplaceSession();
  if (session.email) return <SignedInAccount email={session.email} />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email")); const password = String(data.get("password"));
      await (mode === "login" ? login(email, password) : register(email, password));
      await session.refresh();
      const next = params.get("next");
      router.replace(mode === "register" ? localePath("/account/verify-email", locale) : next?.startsWith("/") && !next.startsWith("//") ? next : localePath("/", locale));
      router.refresh();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : t.serviceError); }
    finally { setSubmitting(false); }
  }
  return <div className="mx-auto max-w-md rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{mode === "login" ? t.signIn : t.createAccount}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{t.accountIntro}</p>
    <form className="mt-7 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">{t.email}<Input name="email" type="email" required autoComplete="email" className="mt-2" /></label>
      <label className="block text-sm font-medium">{t.password}<Input name="password" type="password" minLength={8} maxLength={128} required autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={submitting}>{submitting ? t.wait : mode === "login" ? t.signIn : t.createAccount}</Button>
    </form>
    <button className="mt-5 text-sm font-semibold text-primary" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
      {mode === "login" ? t.needAccount : t.registered}
    </button>
  </div>;
}

function SignedInAccount({ email }: { email: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const [entries, setEntries] = useState<MarketplaceLibraryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fa = locale === "fa";
  useEffect(() => {
    const controller = new AbortController();
    void getMarketplaceLibrary(page, 24, controller.signal)
      .then((result) => { setEntries(result.data); setTotalPages(result.meta.totalPages); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page]);
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="rounded-xl border bg-surface p-7 sm:flex sm:items-end sm:justify-between sm:gap-6"><div><p className="eyebrow">{fa ? "حساب خواننده" : "Reader account"}</p><h1 className="editorial mt-2 text-4xl">{t.account}</h1><p className="mt-3 text-muted-foreground">{t.signedInAs} {email}</p></div><Button className="mt-6 sm:mt-0" variant="secondary" onClick={async () => { await logout(); await session.refresh(); router.replace(localePath("/", locale)); router.refresh(); }}>{t.signOut}</Button></header>
    <section className="rounded-xl border bg-surface p-7" aria-labelledby="account-library-title">
      <h2 id="account-library-title" className="editorial text-3xl">{fa ? "کتابخانهٔ شما" : "Your library"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{fa ? "منابع رایگانی که دریافت کرده‌اید و نسخهٔ دقیق متصل به هر دریافت." : "Free resources you acquired and the exact release pinned to each acquisition."}</p>
      {loading && <p className="mt-6 text-sm text-muted-foreground" role="status">{fa ? "در حال بارگذاری کتابخانه…" : "Loading library…"}</p>}
      {error && <p className="mt-6 text-sm text-destructive" role="alert">{fa ? "بارگذاری کتابخانه انجام نشد." : "The library could not be loaded."}</p>}
      {!loading && !error && entries.length === 0 && <p className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{fa ? "هنوز منبعی به کتابخانه اضافه نکرده‌اید." : "You have not added any resources yet."}</p>}
      {entries.length > 0 && <ul className="mt-6 space-y-3">{entries.map((entry) => <li className="rounded-lg border p-4 sm:flex sm:items-center sm:justify-between sm:gap-5" key={entry.acquisitionId}><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{entry.product.name}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground" dir="ltr">{entry.release ? `v${entry.release.version}` : fa ? "نسخهٔ قدیمی" : "Legacy release"}</span></div><p className="mt-1 text-sm text-muted-foreground">{entry.product.outcome}</p><p className="mt-2 text-xs text-muted-foreground">@{entry.product.creator.handle} · {new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(entry.acquiredAt))}</p></div>{entry.installationAvailable ? <Link className={`${buttonVariants({ size: "sm", variant: "secondary" })} mt-4 sm:mt-0`} href={localePath(`/products/${entry.product.slug}`, locale)}>{fa ? "مشاهدهٔ نصب" : "View installation"}</Link> : <span className="mt-4 text-xs font-semibold text-amber-800 dark:text-amber-300 sm:mt-0">{fa ? "نصب در دسترس نیست" : "Installation unavailable"}</span>}</li>)}</ul>}
      {totalPages > 1 && <nav className="mt-6 flex items-center justify-between" aria-label={fa ? "صفحه‌های کتابخانه" : "Library pages"}><Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>{fa ? "قبلی" : "Previous"}</Button><span className="text-xs text-muted-foreground">{fa ? `صفحهٔ ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}</span><Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>{fa ? "بعدی" : "Next"}</Button></nav>}
    </section>
  </div>;
}
