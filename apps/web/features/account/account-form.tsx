"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, confirmPasswordReset, login, loginWithGoogle, logout, register, requestPasswordReset } from "@/lib/api";
import { useMarketplaceSession } from "./marketplace-session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { AcquiredLibrary } from "@/features/library/acquired-library";
import { GoogleSignIn } from "./google-sign-in";

export function AccountForm() {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter(); const params = useSearchParams(); const session = useMarketplaceSession();
  if (session.email) return <SignedInAccount email={session.email} />;

  async function finishSignIn(verificationRequired = false) {
    await session.refresh();
    const next = params.get("next");
    const destination = next?.startsWith("/") && URL.canParse(next, window.location.origin) ? new URL(next, window.location.origin) : null;
    router.replace(verificationRequired ? localePath("/account/verify-email", locale) : destination?.origin === window.location.origin ? `${destination.pathname}${destination.search}${destination.hash}` : localePath("/", locale));
    router.refresh();
  }

  async function signInWithGoogle(credential: string) {
    setSubmitting(true); setError(null); setStatus(null);
    try { await loginWithGoogle(credential); await finishSignIn(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : t.serviceError); }
    finally { setSubmitting(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null); setStatus(null);
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email")).trim();
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setResetEmail(email);
        setMode("reset");
        setStatus(t.resetCodeSent);
        return;
      }
      if (mode === "reset") {
        await confirmPasswordReset(email, String(data.get("code")), String(data.get("password")));
        setMode("login");
        setStatus(t.resetComplete);
        return;
      }
      const password = String(data.get("password"));
      if (mode === "register" && password !== String(data.get("confirmPassword"))) {
        setError(t.passwordMismatch);
        return;
      }
      if (mode === "register") {
        // The API answers the same whether or not the email was already registered, and
        // starts no session, so the form cannot reveal who has an account.
        await register(email, password);
        setMode("login");
        setStatus(t.registerAccepted);
        return;
      }
      await login(email, password);
      await finishSignIn();
    } catch (cause) {
      if (!(cause instanceof ApiError)) setError(t.serviceError);
      else if (cause.code === "INVALID_CREDENTIALS") setError(t.invalidCredentials);
      else if (cause.code === "INVALID_OR_EXPIRED_OTP") setError(t.resetCodeInvalid);
      else if (cause.code === "PASSWORD_UNCHANGED") setError(t.passwordUnchanged);
      else setError(cause.message);
    }
    finally { setSubmitting(false); }
  }
  return <div className="mx-auto max-w-md rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{mode === "login" ? t.signIn : mode === "register" ? t.createAccount : mode === "forgot" ? t.forgotPassword : t.enterResetCode}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{mode === "forgot" ? t.forgotPasswordIntro : mode === "reset" ? t.resetCodeIntro : t.accountIntro}</p>
    {(mode === "login" || mode === "register") && <GoogleSignIn key={mode} text={mode === "register" ? "signup_with" : "signin_with"} locale={locale} disabled={submitting} onCredential={signInWithGoogle} onUnavailable={() => setError(t.serviceError)} />}
    <form className="mt-7 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">{t.email}<Input name="email" type="email" required autoComplete="email" defaultValue={mode === "reset" ? resetEmail : ""} className="mt-2" /></label>
      {mode === "reset" && <label className="block text-sm font-medium">{t.resetCode}<Input name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="one-time-code" className="mt-2" /></label>}
      {(mode === "login" || mode === "register" || mode === "reset") && <label className="block text-sm font-medium">{mode === "reset" ? t.newPassword : t.password}<Input name="password" type="password" minLength={8} maxLength={128} required autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2" /></label>}
      {mode === "register" && <label className="block text-sm font-medium">{t.confirmPassword}<Input name="confirmPassword" type="password" minLength={8} maxLength={128} required autoComplete="new-password" className="mt-2" /></label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {status && <p role="status" className="text-sm text-primary">{status}</p>}
      <Button className="w-full" disabled={submitting}>{submitting ? t.wait : mode === "login" ? t.signIn : mode === "register" ? t.createAccount : mode === "forgot" ? t.sendResetCode : t.resetPassword}</Button>
    </form>
    <div className="mt-5 flex flex-col items-start gap-3">
      {mode === "login" && <button type="button" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary" onClick={() => { setMode("forgot"); setError(null); setStatus(null); }}>{t.forgotPassword}</button>}
      <button type="button" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setStatus(null); }}>
        {mode === "login" ? t.needAccount : mode === "register" ? t.registered : t.backToSignIn}
      </button>
    </div>
  </div>;
}

function SignedInAccount({ email }: { email: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const fa = locale === "fa";
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="rounded-xl border bg-surface p-7 sm:flex sm:items-end sm:justify-between sm:gap-6"><div><p className="eyebrow">{fa ? "حساب خواننده" : "Reader account"}</p><h1 className="editorial mt-2 text-4xl">{t.account}</h1><p className="mt-3 text-muted-foreground">{t.signedInAs} {email}</p></div><Button className="mt-6 sm:mt-0" variant="secondary" onClick={async () => { await logout(); await session.refresh(); router.replace(localePath("/", locale)); router.refresh(); }}>{t.signOut}</Button></header>
    {!session.emailVerified && <section className="rounded-xl border bg-surface p-7"><p className="text-muted-foreground">{t.verificationInstructions}</p><Link className={`${buttonVariants()} mt-4`} href={localePath("/account/verify-email", locale)}>{t.verifyEmail}</Link></section>}
    <AcquiredLibrary embedded />
  </div>;
}
