"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { syncLocalLibrary } from "@/lib/readerLibrary";
import { localePath, type Locale } from "@/lib/i18n";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } } };
  }
}

export function ReaderAuthForm({ locale = "en" }: { locale?: Locale }) {
  const fa = locale === "fa";
  const router = useRouter();
  const googleButton = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function finishSignIn() {
    await syncLocalLibrary();
    router.push(localePath("/library", locale));
    router.refresh();
  }

  function renderGoogle() {
    if (!clientId || !window.google || !googleButton.current) return;
    googleButton.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setBusy(true); setError("");
        try { await api.loginReaderWithGoogle(credential); await finishSignIn(); }
        catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed."); setBusy(false); }
      },
    });
    window.google.accounts.id.renderButton(googleButton.current, { theme: "outline", size: "large", locale, width: Math.min(320, googleButton.current.clientWidth || 320) });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api.loginReader(email.trim().toLowerCase(), password);
      await finishSignIn();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue."); setBusy(false); }
  }

  return (
    <>
      {clientId && <><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderGoogle} onError={() => setError(fa ? "ورود با گوگل در دسترس نیست. دوباره تلاش کنید." : "Google sign-in is unavailable. Please try again.")} /><div ref={googleButton} className="mt-6 flex justify-center" inert={busy} aria-busy={busy} /></>}
      {clientId && <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-muted"><span className="h-px flex-1 bg-line" />{fa ? "یا" : "or"}<span className="h-px flex-1 bg-line" /></div>}
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label htmlFor="reader-email" className="mb-1 block text-sm font-medium">{fa ? "ایمیل" : "Email"}</label><input id="reader-email" dir="ltr" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-2.5" /></div>
        <div><label htmlFor="reader-password" className="mb-1 block text-sm font-medium">{fa ? "رمز عبور" : "Password"}</label><input id="reader-password" dir="ltr" required minLength={8} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-2.5" /></div>
        <button disabled={busy} className="w-full rounded-lg bg-accent px-5 py-3 font-medium text-white disabled:opacity-50">{busy ? (fa ? "کمی صبر کنید…" : "Please wait…") : (fa ? "ورود" : "Sign in")}</button>
      </form>
      {clientId && <p className="mt-5 text-center text-xs text-ink-muted">{fa ? "حساب‌های تازه از طریق ورود تأییدشدهٔ گوگل ساخته می‌شوند." : "New accounts are created through verified Google sign-in."}</p>}
    </>
  );
}
