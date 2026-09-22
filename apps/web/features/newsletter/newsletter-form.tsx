"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { ApiError, subscribe } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "failed"; message: string };

/**
 * The newsletter sign-up.
 *
 * Success and failure are different states, not one string in a muted
 * paragraph: success replaces the form outright, because leaving a filled
 * field next to "subscribed" invites a second submission, and failure keeps
 * the address the reader typed so retrying is one click rather than a
 * re-type.
 *
 * The API answers 202 for an address that is already subscribed, so this
 * never reports "already on the list" — that would let anyone test whether a
 * given address is a member.
 */
export function NewsletterForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email"));
    setStatus({ kind: "sending" });
    try {
      await subscribe(email);
      setStatus({ kind: "done" });
    } catch (error) {
      console.error("Newsletter subscription failed", error);
      setStatus({ kind: "failed", message: failureMessage(error, t) });
    }
  }

  if (status.kind === "done") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-verified/40 bg-verified/10 p-4"
      >
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-verified" aria-hidden />
        <div>
          <p className="text-sm font-semibold">{t.homePage.newsletterDone}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.homePage.newsletterDoneBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        <input
          name="email"
          type="email"
          required
          aria-label={t.homePage.newsletterEmail}
          aria-invalid={status.kind === "failed"}
          placeholder="you@example.com"
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-border-strong bg-background/80 px-4 backdrop-blur placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className={buttonVariants({ size: "lg" })}
        >
          {status.kind === "sending"
            ? t.homePage.newsletterSending
            : t.homePage.newsletterCta}
        </button>
      </form>

      {status.kind === "failed" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {status.message}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t.homePage.newsletterPrivacy}
      </p>
    </div>
  );
}

function failureMessage(
  error: unknown,
  t: { homePage: { newsletterInvalid: string; newsletterBusy: string; newsletterError: string } },
) {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 422) {
      return t.homePage.newsletterInvalid;
    }
    if (error.status === 429) return t.homePage.newsletterBusy;
  }
  return t.homePage.newsletterError;
}
