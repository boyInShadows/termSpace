"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, confirmEmailVerification, requestEmailVerification, logout } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useMarketplaceSession } from "./marketplace-session";
import { supportTitle } from "@/features/support/support-entry";

type VerificationState = "idle" | "verifying" | "invalid" | "mismatch" | "error";

export function EmailVerification() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("idle");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const started = useRef(false);
  // Kept in memory only: after a sign-out the same link is retried without the
  // reader having to find the email again, and the token never enters the URL
  // or history a second time.
  const pendingToken = useRef<string | null>(null);

  useEffect(() => {
    if (!resent) return;
    const timer = window.setTimeout(() => setResent(false), 60_000);
    return () => window.clearTimeout(timer);
  }, [resent]);

  const verify = useCallback(async (token: string) => {
    pendingToken.current = token;
    setState("verifying");
    try {
      const { data } = await confirmEmailVerification(token);
      pendingToken.current = null;
      await session.refresh();
      router.replace(localePath(data.user.onboardingRequired ? "/onboarding" : "/account", locale));
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "INVALID_OR_EXPIRED_VERIFICATION") setState("invalid");
      else if (cause instanceof ApiError && cause.code === "SIGNED_IN_AS_OTHER_ACCOUNT") setState("mismatch");
      else setState("error");
    }
  }, [session, router, locale]);

  useEffect(() => {
    if (session.loading || session.identityLoading) return;
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    if (!token) {
      // Opening the page without a link is only a status view.
      if (session.emailVerified) router.replace(localePath("/account", locale));
      return;
    }
    // The fragment holds the bearer token; drop it before any request is made.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    queueMicrotask(() => void verify(token));
  }, [session, router, locale, verify]);

  async function resend() {
    setResending(true);
    try { await requestEmailVerification(); setResent(true); setState("idle"); }
    catch { setState("error"); }
    finally { setResending(false); }
  }

  async function logOutAndContinue() {
    setSigningOut(true);
    try {
      await logout();
      await session.refresh();
      const token = pendingToken.current;
      if (token) await verify(token);
    } catch { setState("error"); }
    finally { setSigningOut(false); }
  }

  const message = state === "verifying" ? t.verificationChecking
    : state === "mismatch" ? t.signedInAsOther
      : state === "invalid" ? t.verificationInvalid
        : state === "error" ? t.verificationError
          : t.verificationInstructions;

  if (session.loading || session.identityLoading) return null;

  return <section className="mx-auto max-w-lg border bg-surface p-7" aria-labelledby="verification-title">
    <h1 id="verification-title" className="text-2xl font-semibold">{t.verifyEmail}</h1>
    {session.email && <p className="mt-3 break-all text-sm"><bdi dir="ltr">{session.email}</bdi></p>}
    <p className="mt-3 text-muted-foreground" role="status" aria-live="polite">{message}</p>
    {resent && <p className="mt-3 text-sm text-primary" role="status">{t.verificationSent}</p>}
    <div className="mt-7 flex flex-wrap gap-3">
      {session.email && <Link href={localePath("/dashboard/tickets", locale)} className={buttonVariants({ variant: "secondary" })}>{supportTitle[locale]}</Link>}
      {session.email && !session.emailVerified && state !== "verifying" && <Button onClick={resend} disabled={resending || resent}>{resending ? t.wait : t.resendVerification}</Button>}
      {state === "mismatch" && <Button disabled={signingOut} onClick={logOutAndContinue}>{signingOut ? t.wait : t.logOutAndContinue}</Button>}
      {(state === "invalid" || !session.email) && <Link className={buttonVariants()} href={localePath("/account", locale)}>{t.signIn}</Link>}
      {session.email && <Button variant="secondary" disabled={signingOut} onClick={async () => {
        setSigningOut(true);
        try { await logout(); await session.refresh(); }
        catch { setState("error"); }
        finally { setSigningOut(false); }
      }}>{signingOut ? t.wait : t.signOut}</Button>}
    </div>
  </section>;
}
