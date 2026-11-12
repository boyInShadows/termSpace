"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { createSupportTicket, type SupportCategory } from "@/lib/support-api";
import { supportCopy } from "./support-copy";
import { supportFailure, supportField, supportPanel, SupportSwitch } from "./support-ui";
import { useUnsentWarning } from "./use-unsent-warning";

export function NewTicket() {
  const { locale } = useLocale(); const copy = supportCopy[locale];
  const router = useRouter();
  const [category, setCategory] = useState<SupportCategory>("GENERAL");
  const [subject, setSubject] = useState(""); const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false); const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const allowLeave = useUnsentWarning(Boolean(subject || message || category !== "GENERAL"), copy.leave);
  const back = localePath("/dashboard/tickets", locale);
  return <section className="mx-auto max-w-[42rem]" aria-labelledby="new-ticket-heading">
    <SupportSwitch inbox={false} />
    <Link href={back} className={`${buttonVariants({ variant: "ghost" })} mb-4`}>{copy.back}</Link>
    <h1 id="new-ticket-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.new}</h1>
    <p className="mb-7 mt-2 text-sm leading-relaxed text-muted-foreground">{copy.formIntro}</p>
    <form className={`${supportPanel} space-y-6`} aria-busy={sending} onSubmit={async event => {
      event.preventDefault();
      if (pending.current) return;
      if (!subject.trim() || subject.trim().length > 120 || !message.trim() || message.trim().length > 5000) { setError(copy.invalid); return; }
      pending.current = true; setSending(true); setError(null);
      try {
        const ticket = await createSupportTicket({ category, subject: subject.trim(), message: message.trim() });
        allowLeave(); router.push(localePath(`/dashboard/tickets/${ticket.id}?created=1`, locale));
      } catch (cause) { setError(supportFailure(cause, copy, copy.failedSend)); }
      finally { pending.current = false; setSending(false); }
    }}>
      <div className="space-y-2"><label htmlFor="ticket-category" className="text-sm font-medium">{copy.category}</label>
        <select id="ticket-category" value={category} disabled={sending} onChange={event => setCategory(event.target.value as SupportCategory)} className={supportField}>
          {Object.entries(copy.categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></div>
      <div className="space-y-2"><label htmlFor="ticket-subject" className="text-sm font-medium">{copy.subject}</label>
        <input id="ticket-subject" value={subject} onChange={event => setSubject(event.target.value)} disabled={sending} maxLength={120} required dir="auto" aria-describedby="ticket-limits" className={supportField} /></div>
      <div className="space-y-2"><label htmlFor="ticket-message" className="text-sm font-medium">{copy.message}</label>
        <p id="ticket-help" className="text-sm leading-relaxed text-muted-foreground">{copy.messageHelp}</p>
        <textarea id="ticket-message" value={message} onChange={event => setMessage(event.target.value)} disabled={sending} maxLength={5000} required dir="auto" aria-describedby="ticket-help ticket-limits" className={`${supportField} min-h-48 resize-y leading-relaxed`} />
        <p id="ticket-limits" className="text-xs leading-relaxed text-muted-foreground">{copy.limits}</p></div>
      {error && <p role="alert" className="text-sm leading-relaxed text-foreground">{error}</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={sending}>{sending ? copy.creating : copy.create}</Button>
        <Link href={back} className={buttonVariants({ variant: "ghost" })}>{copy.cancel}</Link></div>
    </form>
  </section>;
}
