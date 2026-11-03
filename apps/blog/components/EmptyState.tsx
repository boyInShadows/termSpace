interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyCollection({ locale }: { locale: Locale }) {
  return <EmptyState
    title={locale === "fa" ? "هنوز مطلبی در این بخش منتشر نشده است." : "Nothing has been published here yet."}
    description={locale === "fa" ? "مطلب‌های تازه در راه‌اند. می‌توانید مقاله‌های دیگر را مرور کنید." : "New writing is on the way. Browse other articles while you wait."}
    action={<Link className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm text-white hover:bg-accent-soft" href={localePath("/blog", locale)}>{copy[locale].allArticles}</Link>}
  />;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-line bg-paper-card p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-warm text-ink-faint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v14M12 3v14M5 3h14M5 3h14" />
        </svg>
      </div>
      <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
import Link from "next/link";
import { copy, localePath, type Locale } from "@/lib/i18n";
