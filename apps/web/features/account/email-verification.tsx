"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, confirmEmailVerification, requestEmailVerification } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useMarketplaceSession } from "./marketplace-session";

type VerificationState = "idle" | "verifying" | "verified" | "invalid" | "error";

export function EmailVerification() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const [state, setState] = useState<VerificationState>("idle");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    if (!token) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    queueMicrotask(() => setState("verifying"));
    void confirmEmailVerification(token)
      .then(async () => { setState("verified"); await session.refresh(); })
      .catch((cause) => setState(cause instanceof ApiError && cause.code === "INVALID_OR_EXPIRED_VERIFICATION" ? "invalid" : "error"));
  }, [session]);

  async function resend() {
    setResending(true);
    try { await requestEmailVerification(); setResent(true); }
    catch { setState("error"); }
    finally { setResending(false); }
  }

  const message = state === "verifying" ? t.verificationChecking
    : state === "verified" || session.emailVerified ? t.verificationComplete
      : state === "invalid" ? t.verificationInvalid
        : state === "error" ? t.verificationError
          : t.verificationInstructions;

  return <section className="mx-auto max-w-lg rounded-xl border bg-surface p-7" aria-labelledby="verification-title">
    <h1 id="verification-title" className="editorial text-4xl">{t.verifyEmail}</h1>
    <p className="mt-3 text-muted-foreground" role="status" aria-live="polite">{message}</p>
    {resent && <p className="mt-3 text-sm text-primary" role="status">{t.verificationSent}</p>}
    <div className="mt-7 flex flex-wrap gap-3">
      {session.email && !session.emailVerified && state !== "verified" && <Button onClick={resend} disabled={resending || resent}>{resending ? t.wait : t.resendVerification}</Button>}
      {(state === "verified" || session.emailVerified) && <Link className={buttonVariants()} href={localePath("/account", locale)}>{t.returnToAccount}</Link>}
      {!session.loading && !session.email && <Link className={buttonVariants()} href={localePath("/account", locale)}>{t.signIn}</Link>}
    </div>
  </section>;
}
