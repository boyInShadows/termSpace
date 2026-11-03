"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, login, loginWithGoogle, logout, register, requestPasswordReset } from "@/lib/api";
import { useMarketplaceSession } from "./marketplace-session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { libraryCopy } from "@/features/library/library-copy";
import { GoogleSignIn } from "./google-sign-in";

type Mode = "login" | "register" | "forgot";
type Sent = { kind: "register" | "reset"; email: string };

export function AccountForm() {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<Mode>("login");
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter(); const params = useSearchParams(); const session = useMarketplaceSession();
  if (session.email) return <SignedInAccount email={session.email} />;
  if (sent) return <SentPanel sent={sent} />;

  async function finishSignIn(onboardingRequired = false) {
    await session.refresh();
    const next = params.get("next");
    const destination = next?.startsWith("/") && URL.canParse(next, window.location.origin) ? new URL(next, window.location.origin) : null;
    router.replace(onboardingRequired ? localePath("/onboarding", locale) : destination?.origin === window.location.origin ? `${destination.pathname}${destination.search}${destination.hash}` : localePath("/", locale));
    router.refresh();
  }

  async function signInWithGoogle(credential: string) {
    setSubmitting(true); setError(null);
    try { const { data } = await loginWithGoogle(credential); await finishSignIn(data?.authenticated && data.user.onboardingRequired); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : t.serviceError); }
    finally { setSubmitting(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email")).trim();
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setSent({ kind: "reset", email });
        return;
      }
      const password = String(data.get("password"));
      if (mode === "register") {
        if (password !== String(data.get("confirmPassword"))) {
          setError(t.passwordMismatch);
          return;
        }
        // The API answers the same whether or not the email was already registered, and
        // starts no session, so the form cannot reveal who has an account.
        await register(email, password);
        setSent({ kind: "register", email });
        return;
      }
      const { data: signedIn } = await login(email, password);
      await finishSignIn(signedIn?.authenticated && signedIn.user.onboardingRequired);
    } catch (cause) {
      if (!(cause instanceof ApiError)) setError(t.serviceError);
      else if (cause.code === "INVALID_CREDENTIALS") setError(t.invalidCredentials);
      else setError(cause.message);
    }
    finally { setSubmitting(false); }
  }

  return <div className="mx-auto max-w-md rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{mode === "login" ? t.signIn : mode === "register" ? t.createAccount : t.forgotPassword}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{mode === "forgot" ? t.forgotPasswordIntro : t.accountIntro}</p>
    {(mode === "login" || mode === "register") && <GoogleSignIn key={mode} text={mode === "register" ? "signup_with" : "signin_with"} locale={locale} disabled={submitting} onCredential={signInWithGoogle} onUnavailable={() => setError(t.serviceError)} />}
    <form className="mt-7 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">{t.email}<Input name="email" type="email" required autoComplete="email" className="mt-2" /></label>
      {(mode === "login" || mode === "register") && <label className="block text-sm font-medium">{t.password}<Input name="password" type="password" minLength={8} maxLength={128} required autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2" /></label>}
      {mode === "register" && <label className="block text-sm font-medium">{t.confirmPassword}<Input name="confirmPassword" type="password" minLength={8} maxLength={128} required autoComplete="new-password" className="mt-2" /></label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={submitting}>{submitting ? t.wait : mode === "login" ? t.signIn : mode === "register" ? t.createAccount : t.sendResetLink}</Button>
    </form>
    <div className="mt-5 flex flex-col items-start gap-3">
      {mode === "login" && <button type="button" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary" onClick={() => { setMode("forgot"); setError(null); }}>{t.forgotPassword}</button>}
      <button type="button" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
        {mode === "login" ? t.needAccount : mode === "register" ? t.registered : t.backToSignIn}
      </button>
    </div>
  </div>;
}

/**
 * The only thing a new signup or a reset request should see: the message, the
 * address it went to, and permission to close the tab. No form, no resend:
 * both actions would need the reader to act on the email first.
 */
function SentPanel({ sent }: { sent: Sent }) {
  const { t } = useLocale();
  return <div className="mx-auto max-w-md rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{t.checkInbox}</h1>
    <p className="mt-3 text-sm text-muted-foreground">
      {sent.kind === "register" ? t.signupLinkSent : t.resetLinkSent} <bdi dir="ltr" className="break-all">{sent.email}</bdi> {sent.kind === "register" ? t.signupLinkSentTail : t.resetLinkSentTail}
    </p>
    <p className="mt-3 text-sm text-muted-foreground">{t.closeWindowSafe}</p>
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
    <section className="rounded-xl border bg-surface p-7"><h2 className="text-xl font-semibold">{libraryCopy[locale].title}</h2><p className="mt-3 text-muted-foreground">{libraryCopy[locale].intro}</p><Link className={`${buttonVariants({ variant: "secondary" })} mt-4`} href={localePath("/dashboard/library", locale)}>{libraryCopy[locale].quickAction}</Link></section>
  </div>;
}
