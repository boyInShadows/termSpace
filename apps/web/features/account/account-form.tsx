"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, login, logout, register } from "@/lib/api";
import { useMarketplaceSession } from "./marketplace-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

export function AccountForm() {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter(); const params = useSearchParams(); const session = useMarketplaceSession();
  if (session.email) return <div className="mx-auto max-w-md rounded-xl border bg-surface p-7"><h1 className="editorial text-4xl">{t.account}</h1><p className="mt-3 text-muted-foreground">{t.signedInAs} {session.email}</p><Button className="mt-7" variant="secondary" onClick={async () => { await logout(); await session.refresh(); router.replace("/"); router.refresh(); }}>{t.signOut}</Button></div>;
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
