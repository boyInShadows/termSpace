"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { confirmEmailChange } from "@/lib/account-api";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { emailChangeCopy } from "./email-change-copy";
import { useMarketplaceSession } from "./marketplace-session";

type State = "waiting" | "checking" | "changed" | "invalid" | "unavailable" | "error";

export function EmailChangeConfirmation() {
  const { locale } = useLocale();
  const copy = emailChangeCopy[locale];
  const session = useMarketplaceSession();
  const [state, setState] = useState<State>("waiting");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) return;
    // Drop the token from the address bar and history before anything else runs.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    queueMicrotask(() => setState("checking"));
    void confirmEmailChange(token)
      .then(async () => { setState("changed"); await session.refresh(); })
      .catch((cause) => setState(cause instanceof ApiError && cause.code === "EMAIL_UNAVAILABLE" ? "unavailable" : cause instanceof ApiError && cause.code === "INVALID_OR_EXPIRED_EMAIL_CHANGE" ? "invalid" : "error"));
  }, [session]);

  const message = { waiting: copy.noToken, checking: copy.checking, changed: copy.changed, invalid: copy.invalid, unavailable: copy.unavailable, error: copy.confirmFailed }[state];
  const failed = state === "invalid" || state === "unavailable" || state === "error";
  const signIn = state === "changed" || state === "waiting";

  return <section className="mx-auto max-w-lg border bg-surface p-7" aria-labelledby="email-change-title">
    <h1 id="email-change-title" className="text-2xl font-semibold">{copy.confirmTitle}</h1>
    <p className="mt-3 text-muted-foreground" role={failed ? "alert" : "status"} aria-live="polite">{message}</p>
    {state !== "checking" && <div className="mt-7"><Link className={buttonVariants()} href={localePath(signIn ? "/account" : "/dashboard/settings", locale)}>{signIn ? copy.signIn : copy.openSettings}</Link></div>}
  </section>;
}
