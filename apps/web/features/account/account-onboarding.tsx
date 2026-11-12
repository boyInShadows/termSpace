"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { getOnboarding, saveOnboarding, onboardingOptions, type OnboardingAnswers, type OnboardingProfile } from "@/lib/onboarding-api";
import { useMarketplaceSession } from "./marketplace-session";
import { onboardingCopy } from "./onboarding-copy";

function failureMessage(cause: unknown, copy: typeof onboardingCopy.en | typeof onboardingCopy.fa) {
  if (!(cause instanceof ApiError) || cause.status === 0) return copy.offline;
  if (cause.status === 401) return copy.expired;
  if (cause.status === 429) return copy.rateLimited;
  if (cause.status === 400) return copy.invalid;
  return copy.failed;
}

/** First-run questions. The answers are collected once and are not shown or edited in Profile. */
export function AccountOnboarding() {
  const session = useMarketplaceSession();
  const { locale } = useLocale();
  const copy = onboardingCopy[locale];
  const router = useRouter();
  const signIn = `${localePath("/account", locale)}?next=${encodeURIComponent(localePath("/onboarding", locale))}`;
  useEffect(() => {
    if (!session.identityLoading && !session.email) router.replace(signIn);
  }, [session.identityLoading, session.email, router, signIn]);
  if (session.identityLoading) return <p role="status">{copy.loading}</p>;
  if (!session.email) return <Link className={buttonVariants()} href={signIn}>{copy.signIn}</Link>;
  return <ProfileDetails key={session.email} />;
}

function ProfileDetails() {
  const { locale } = useLocale();
  const copy = onboardingCopy[locale];
  const router = useRouter();
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; profile: OnboardingProfile }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const completed = state.status === "ready" && !state.profile.required && state.profile.intent;

  useEffect(() => {
    const controller = new AbortController();
    void getOnboarding(controller.signal)
      .then((profile) => { if (!controller.signal.aborted) setState({ status: "ready", profile }); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setState({ status: "error", message: failureMessage(cause, copy) }); });
    return () => controller.abort();
  }, [attempt, copy]);

  useEffect(() => {
    if (completed) router.replace(localePath(completed === "create" ? "/dashboard/studio" : "/explore", locale));
  }, [completed, router, locale]);

  return <section className="rounded-card border border-border bg-surface p-5 sm:p-7 [&_:is(input,button,a)]:scroll-mt-32 [&_:is(input,button,a)]:scroll-mb-[calc(6rem+env(safe-area-inset-bottom))]" aria-labelledby="profile-details-title">
    <h1 id="profile-details-title" className="text-2xl font-semibold sm:text-3xl">{copy.title}</h1>
    <p className="mt-3 text-sm text-muted-foreground">{copy.intro}</p>
    <p className="mt-3 max-w-prose text-sm text-muted-foreground">{copy.privacy}</p>
    {state.status === "loading" ? <p role="status" className="mt-6 text-sm">{copy.loading}</p>
      : state.status === "error" ? <div className="mt-6"><p role="alert" className="text-sm text-destructive">{state.message}</p><Button variant="secondary" className="mt-3" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div>
        : completed ? <p role="status" className="mt-6">{copy.redirecting}</p>
          : <ProfileForm initial={state.profile} />}
  </section>;
}

function ProfileForm({ initial }: { initial: OnboardingProfile }) {
  const { locale } = useLocale();
  const copy = onboardingCopy[locale];
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers>({ role: initial.role, goal: initial.goal, tools: initial.tools, intent: initial.intent });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeQuestion = useRef<HTMLLegendElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (step !== previousStep.current) activeQuestion.current?.focus();
    previousStep.current = step;
  }, [step]);

  function update<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function toggleTool(tool: OnboardingAnswers["tools"][number]) {
    update("tools", answers.tools.includes(tool) ? answers.tools.filter((value) => value !== tool)
      : tool === "getting_started" ? [tool] : [...answers.tools.filter((value) => value !== "getting_started"), tool]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const present = [Boolean(answers.role), Boolean(answers.goal), answers.tools.length > 0, Boolean(answers.intent)];
    const missing = step < 3 ? present[step] ? -1 : step : present.findIndex((value) => !value);
    if (missing !== -1) {
      setStep(missing);
      setError(missing === 2 ? copy.chooseTools : copy.choose);
      return;
    }
    setError(null);
    if (step < 3) { setStep(step + 1); return; }
    setBusy(true);
    try {
      await saveOnboarding(answers);
      router.replace(localePath(answers.intent === "create" ? "/dashboard/studio" : "/explore", locale));
      router.refresh();
    } catch (cause) { setError(failureMessage(cause, copy)); }
    finally { setBusy(false); }
  }

  const questions = [
    { title: copy.role, key: "role", options: onboardingOptions.role, labels: copy.roles },
    { title: copy.goal, key: "goal", options: onboardingOptions.goal, labels: copy.goals },
    { title: copy.toolsQuestion, key: "tools", options: onboardingOptions.tools, labels: copy.tools },
    { title: copy.intent, key: "intent", options: onboardingOptions.intent, labels: copy.intents },
  ] as const;

  return <form className="mt-7 space-y-7" aria-label={copy.title} aria-busy={busy} onSubmit={submit}>
    <p className="text-sm text-muted-foreground" aria-live="polite">{copy.step(step + 1)}</p>
    {questions.map((question, index) => <fieldset key={question.key} hidden={index !== step} disabled={busy}>
      <legend ref={index === step ? activeQuestion : undefined} tabIndex={-1} className="max-w-prose text-lg font-semibold outline-none">{question.title}</legend>
      {question.key === "tools" && <p id="onboarding-tools-help" className="mt-2 text-sm text-muted-foreground">{copy.toolsHelp}</p>}
      {question.key === "intent" && <p id="onboarding-intent-help" className="mt-2 max-w-prose text-sm text-muted-foreground">{copy.intentHelp}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-input bg-background px-4 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <input type={question.key === "tools" ? "checkbox" : "radio"} name={`onboarding-${question.key}`} value={option}
            className="size-4 shrink-0 accent-primary"
            aria-describedby={question.key === "tools" ? "onboarding-tools-help" : question.key === "intent" ? "onboarding-intent-help" : undefined}
            checked={question.key === "tools" ? answers.tools.some((value) => value === option) : answers[question.key] === option}
            onChange={() => {
              if (question.key === "tools") toggleTool(option as OnboardingAnswers["tools"][number]);
              else update(question.key, option as Exclude<OnboardingAnswers["role" | "goal" | "intent"], null>);
            }} />
          <bdi>{(question.labels as Record<string, string>)[option]}</bdi>
        </label>)}
      </div>
    </fieldset>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap items-center gap-3">
      {step > 0 && <Button type="button" variant="secondary" disabled={busy} onClick={() => { setStep(step - 1); setError(null); }}>{copy.back}</Button>}
      <Button disabled={busy} type="submit">{busy ? copy.saving : step < 3 ? copy.continue : answers.intent === "create" ? copy.studio : copy.explore}</Button>
    </div>
  </form>;
}
