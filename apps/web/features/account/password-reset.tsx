"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, confirmPasswordReset, logout } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useMarketplaceSession } from "./marketplace-session";

type State = "form" | "saving" | "mismatch" | "invalid";

/**
 * The page a reset email links to. The bearer token arrives in the fragment and
 * is removed before the form is usable, so it never reaches server logs, and
 * the only fields are the new password and its confirmation.
 */
export function PasswordReset() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const router = useRouter();
  const [state, setState] = useState<State>("form");
  const [error, setError] = useState<string | null>(null);
  const token = useRef<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const value = hash.get("token");
    if (!value) { queueMicrotask(() => setState("invalid")); return; }
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    token.current = value;
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirmPassword"))) { setError(t.passwordMismatch); return; }
    if (!token.current) { setState("invalid"); return; }
    setState("saving");
    try {
      await confirmPasswordReset(token.current, password);
      await session.refresh();
      router.replace(localePath("/dashboard/settings", locale));
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "SIGNED_IN_AS_OTHER_ACCOUNT") { setState("mismatch"); return; }
      if (cause instanceof ApiError && cause.code === "PASSWORD_UNCHANGED") { setError(t.passwordUnchanged); setState("form"); return; }
      if (cause instanceof ApiError && cause.code === "INVALID_OR_EXPIRED_RESET_TOKEN") { setState("invalid"); return; }
      setError(cause instanceof ApiError ? cause.message : t.serviceError);
      setState("form");
    }
  }

  async function logOut() {
    try { await logout(); await session.refresh(); setState("form"); }
    catch { setError(t.serviceError); }
  }

  if (state === "invalid") {
    return <section className="mx-auto max-w-md rounded-xl border bg-surface p-7" aria-labelledby="reset-title">
      <h1 id="reset-title" className="editorial text-4xl">{t.resetPasswordTitle}</h1>
      <p className="mt-3 text-sm text-muted-foreground" role="alert">{t.invalidResetLink}</p>
      <Link className={`${buttonVariants()} mt-6`} href={localePath("/account", locale)}>{t.requestNewLink}</Link>
    </section>;
  }

  if (state === "mismatch") {
    return <section className="mx-auto max-w-md rounded-xl border bg-surface p-7" aria-labelledby="reset-title">
      <h1 id="reset-title" className="editorial text-4xl">{t.resetPasswordTitle}</h1>
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {t.signedInAsOther} {session.email && <bdi dir="ltr" className="break-all">{session.email}</bdi>}
      </p>
      <Button className="mt-6" onClick={logOut}>{t.logOutAndContinue}</Button>
    </section>;
  }

  return <section className="mx-auto max-w-md rounded-xl border bg-surface p-7" aria-labelledby="reset-title">
    <h1 id="reset-title" className="editorial text-4xl">{t.resetPasswordTitle}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{t.resetPasswordIntro}</p>
    {session.email && <p className="mt-3 break-all text-sm"><bdi dir="ltr">{session.email}</bdi></p>}
    <form className="mt-7 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">{t.newPassword}<Input name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" className="mt-2" /></label>
      <label className="block text-sm font-medium">{t.confirmPassword}<Input name="confirmPassword" type="password" minLength={8} maxLength={128} required autoComplete="new-password" className="mt-2" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={state === "saving"}>{state === "saving" ? t.wait : t.savePassword}</Button>
    </form>
  </section>;
}
