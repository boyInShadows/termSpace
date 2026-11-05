"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { localePath, type Locale } from "@/lib/i18n";
import type { ReaderLibrary, ReaderProfile } from "@/lib/types";
import { ReaderAuthForm } from "@/components/ReaderAuthForm";

export function ReaderAccount({ locale = "en" }: { locale?: Locale }) {
  const fa = locale === "fa";
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [library, setLibrary] = useState<ReaderLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.getReaderProfile(), api.getReaderLibrary()])
      .then(([profileResponse, libraryResponse]) => {
        if (!active) return;
        setProfile(profileResponse.data);
        setLibrary(libraryResponse.data);
      })
      .catch((error) => {
        if (active && !(error instanceof ApiClientError && error.status === 401)) {
          setPasswordError(error instanceof Error ? error.message : (fa ? "بارگذاری نمایهٔ شما انجام نشد. دوباره تلاش کنید." : "Unable to load your profile."));
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fa]);

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword.length < 8) {
      setPasswordError(fa ? "رمز عبور تازه باید دست‌کم ۸ نویسه باشد." : "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(fa ? "تکرار رمز عبور با رمز تازه یکسان نیست." : "Password confirmation does not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await api.changeReaderPassword(currentPassword, newPassword);
      setProfile((value) => value ? { ...value, hasPassword: true } : value);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(fa ? "رمز عبور شما به‌روزرسانی شد." : "Your password has been updated.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : (fa ? "به‌روزرسانی رمز عبور انجام نشد. دوباره تلاش کنید." : "Unable to update your password."));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function logout() {
    if (logoutBusy) return;
    setLogoutBusy(true); setLogoutError("");
    try {
      await api.logoutReader();
      setProfile(null); setLibrary(null);
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : (fa ? "خروج انجام نشد. دوباره تلاش کنید." : "Could not sign out. Try again."));
    } finally { setLogoutBusy(false); }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16" role="status">{fa ? "در حال بارگذاری حساب…" : "Loading your account…"}</div>;
  }

  if (!profile || !library) {
    return <div className="mx-auto max-w-md px-6 py-16"><div className="rounded-xl border border-line bg-paper-card p-6"><p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{fa ? "حساب خواننده" : "Reader account"}</p><h1 className="mt-2 font-serif text-3xl font-semibold">{fa ? "همگام‌سازی کتابخانه" : "Sync your library"}</h1><p className="mt-3 text-sm leading-6 text-ink-soft">{fa ? "برای نگهداری نشانک‌ها و پیشرفت مطالعه در همهٔ دستگاه‌ها وارد شوید. همهٔ محتوا بدون حساب نیز در دسترس است." : "Sign in to keep bookmarks and reading progress across devices. All content remains available without an account."}</p>{passwordError && <p role="alert" className="mt-4 text-sm text-red-700">{passwordError}</p>}<ReaderAuthForm locale={locale} /></div></div>;
  }

  const articleList = (title: string, items: { article: ReaderLibrary["history"][number]["article"]; percentage?: number; visitedAt?: string }[]) => (
    <section className="rounded-xl border border-line bg-paper-card p-6">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-4">
        {items.map(({ article, percentage, visitedAt }) => <li key={article.id}><Link href={localePath(`/blog/${article.slug}`, locale)} className="font-medium hover:text-accent">{article.title}</Link>{percentage !== undefined && <><div className="mt-2 h-1.5 overflow-hidden rounded bg-paper-warm"><div className="h-full bg-accent" style={{ width: `${percentage}%` }} /></div><p className="mt-1 text-xs text-ink-muted">{fa ? `${percentage}٪ مطالعه شده` : `${percentage}% read`}</p></>}{visitedAt && <p className="mt-1 text-xs text-ink-muted">{new Date(visitedAt).toLocaleDateString(fa ? "fa-IR" : "en")}</p>}</li>)}
        {items.length === 0 && <li className="text-sm text-ink-muted">{fa ? "هنوز چیزی اینجا نیست." : "Nothing here yet."}</li>}
      </ul>
    </section>
  );

  return <div className="mx-auto max-w-5xl px-6 py-16"><header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{fa ? "نمایهٔ خواننده" : "Reader profile"}</p><h1 className="mt-2 font-serif text-4xl font-semibold">{profile.email}</h1><p className="mt-3 text-sm text-ink-muted">{fa ? "عضو از" : "Member since"} {new Date(profile.createdAt).toLocaleDateString(fa ? "fa-IR" : "en", { dateStyle: "medium" })} · {profile.connectedGoogle ? (fa ? "گوگل متصل است" : "Google connected") : (fa ? "ورود با ایمیل" : "Email sign-in")}</p></div><button type="button" disabled={logoutBusy} onClick={() => void logout()} className="rounded-md border border-line px-4 py-2 text-sm">{fa ? "خروج" : "Sign out"}</button></header>{logoutError && <p role="alert" className="mt-3 text-sm text-red-700">{logoutError}</p>}<div className="mt-10 grid gap-6 md:grid-cols-2">{articleList(fa ? `نشانک‌ها (${library.bookmarks.length})` : `Bookmarks (${library.bookmarks.length})`, library.bookmarks.map(({ article, createdAt }) => ({ article, visitedAt: createdAt })))}{articleList(fa ? `تاریخچهٔ مطالعه (${library.history.length})` : `Reading history (${library.history.length})`, library.history.map(({ article, percentage, visitedAt }) => ({ article, percentage, visitedAt })))}</div><section className="mt-8 max-w-xl rounded-xl border border-line bg-paper-card p-6"><h2 className="font-serif text-2xl font-semibold">{profile.hasPassword ? (fa ? "تغییر رمز عبور" : "Change password") : (fa ? "امنیت حساب" : "Account security")}</h2>{profile.hasPassword ? <><p className="mt-2 text-sm text-ink-soft">{fa ? "پس از تغییر، نشست‌های دیگر شما خارج می‌شوند." : "Changing your password signs out your other sessions."}</p><form onSubmit={changePassword} className="mt-5 space-y-4"><div><label htmlFor="current-password" className="mb-1 block text-sm font-medium">{fa ? "رمز عبور فعلی" : "Current password"}</label><input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-line-input px-4 py-2.5" /></div><div><label htmlFor="new-password" className="mb-1 block text-sm font-medium">{fa ? "رمز عبور تازه" : "New password"}</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-line-input px-4 py-2.5" /></div><div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">{fa ? "تکرار رمز عبور تازه" : "Confirm new password"}</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-line-input px-4 py-2.5" /></div><button disabled={passwordBusy} className="rounded-lg bg-action px-5 py-2.5 font-medium text-action-foreground disabled:opacity-50 hover:bg-action-hover">{passwordBusy ? (fa ? "در حال ذخیره…" : "Saving…") : (fa ? "ذخیرهٔ رمز عبور" : "Save password")}</button>{passwordError && <p role="alert" className="text-sm text-red-700">{passwordError}</p>}{passwordSuccess && <p role="status" className="text-sm text-green-700">{passwordSuccess}</p>}</form></> : <p className="mt-2 text-sm text-ink-soft">{fa ? "برای افزودن رمز عبور، ابتدا دوباره با گوگل وارد شوید. این کار از تغییر دائمی حساب با یک نشست سرقت‌شده جلوگیری می‌کند." : "Sign in with Google again before adding a password. This prevents a stolen session from making a permanent account change."}</p>}</section></div>;
}
